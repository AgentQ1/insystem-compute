package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"github.com/insystem-compute/gateway/hub"
)

const (
	Version     = "1.0.0"
	DefaultPort = "8080"
)

type Server struct {
	config *Config
	router *mux.Router
	engine interface{} // FFI to Rust engine
	hubReg *hub.Registry
}

type Config struct {
	Port        string `json:"port"`
	Device      string `json:"device"`
	Threads     int    `json:"threads"`
	MemoryLimit int64  `json:"memory_limit"`
	EnableAuth  bool   `json:"enable_auth"`
	APIKey      string `json:"api_key"`
	HubRegistry string `json:"hub_registry"`
}

type InferenceRequest struct {
	Model      string            `json:"model"`
	Prompt     string            `json:"prompt"`
	MaxTokens  int               `json:"max_tokens"`
	Stream     bool              `json:"stream"`
	Parameters map[string]interface{} `json:"parameters"`
}

type InferenceResponse struct {
	ID      string `json:"id"`
	Text    string `json:"text"`
	Tokens  int    `json:"tokens"`
	Latency int64  `json:"latency_ms"`
}

type HealthResponse struct {
	Status  string `json:"status"`
	Version string `json:"version"`
	Uptime  int64  `json:"uptime_seconds"`
	Memory  struct {
		Used      int64 `json:"used_bytes"`
		Available int64 `json:"available_bytes"`
		Total     int64 `json:"total_bytes"`
	} `json:"memory"`
}

func NewServer(config *Config) (*Server, error) {
	s := &Server{
		config: config,
		router: mux.NewRouter(),
	}

	if err := s.initHub(); err != nil {
		return nil, err
	}

	// Initialize routes
	s.setupRoutes()

	return s, nil
}

func (s *Server) setupRoutes() {
	// API v1 routes
	api := s.router.PathPrefix("/api/v1").Subrouter()
	
	// Health and info
	api.HandleFunc("/health", s.handleHealth).Methods("GET")
	api.HandleFunc("/info", s.handleInfo).Methods("GET")
	
	// Model management
	api.HandleFunc("/models", s.handleListModels).Methods("GET")
	api.HandleFunc("/models/load", s.handleLoadModel).Methods("POST")
	api.HandleFunc("/models/{id}/unload", s.handleUnloadModel).Methods("DELETE")
	
	// Inference
	api.HandleFunc("/generate", s.handleGenerate).Methods("POST")
	api.HandleFunc("/completions", s.handleCompletions).Methods("POST")
	api.HandleFunc("/chat/completions", s.handleChatCompletions).Methods("POST")
	
	// Streaming
	api.HandleFunc("/generate/stream", s.handleGenerateStream).Methods("POST")
	
	// Middleware
	if s.config.EnableAuth {
		api.Use(s.authMiddleware)
	}
	api.Use(s.loggingMiddleware)
	api.Use(s.corsMiddleware)

	// Static Hub UI (served from ./static/ when running from gateway/)
	s.router.PathPrefix("/hub/").Handler(http.StripPrefix("/hub/", http.FileServer(http.Dir("static"))))

	// Hub API
	api.HandleFunc("/hub/models", s.hubListModels).Methods("GET")
	api.HandleFunc("/hub/models", s.hubRegisterModel).Methods("POST")
	api.HandleFunc("/hub/models/{id}", s.hubGetModel).Methods("GET")
	api.HandleFunc("/hub/models/{id}/download", s.hubDownloadFile).Methods("GET")
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	health := HealthResponse{
		Status:  "healthy",
		Version: Version,
		Uptime:  int64(time.Since(time.Now()).Seconds()),
		Memory: struct {
			Used      int64 `json:"used_bytes"`
			Available int64 `json:"available_bytes"`
			Total     int64 `json:"total_bytes"`
		}{
			Used:      0, // TODO: Get from engine
			Available: s.config.MemoryLimit,
			Total:     s.config.MemoryLimit,
		},
	}
	
	respondJSON(w, http.StatusOK, health)
}

func (s *Server) handleInfo(w http.ResponseWriter, r *http.Request) {
	info := map[string]interface{}{
		"version":      Version,
		"device":       s.config.Device,
		"threads":      s.config.Threads,
		"memory_limit": s.config.MemoryLimit,
		"api_version":  "1.0.0",
	}
	
	respondJSON(w, http.StatusOK, info)
}

func (s *Server) handleGenerate(w http.ResponseWriter, r *http.Request) {
	var req InferenceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	startTime := time.Now()
	
	// TODO: Call Rust engine via FFI
	response := InferenceResponse{
		ID:      generateID(),
		Text:    "Generated text response",
		Tokens:  100,
		Latency: time.Since(startTime).Milliseconds(),
	}
	
	respondJSON(w, http.StatusOK, response)
}

func (s *Server) handleCompletions(w http.ResponseWriter, r *http.Request) {
	// OpenAI-compatible completions endpoint
	s.handleGenerate(w, r)
}

func (s *Server) handleChatCompletions(w http.ResponseWriter, r *http.Request) {
	// OpenAI-compatible chat completions endpoint
	var req struct {
		Model    string                   `json:"model"`
		Messages []map[string]interface{} `json:"messages"`
		Stream   bool                     `json:"stream"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Convert messages to prompt and call generate
	// TODO: pass formatted prompt through to generate handler
	s.handleGenerate(w, r)
}

func (s *Server) handleGenerateStream(w http.ResponseWriter, r *http.Request) {
	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	
	// TODO: Implement streaming generation
	fmt.Fprintf(w, "data: {\"text\": \"Streaming token 1\"}\n\n")
	w.(http.Flusher).Flush()
}

func (s *Server) handleListModels(w http.ResponseWriter, r *http.Request) {
	models := []map[string]interface{}{
		{
			"id":      "llama-3b-q4",
			"name":    "Llama 3B (4-bit)",
			"size":    "2GB",
			"loaded":  false,
			"format":  "gguf",
		},
	}
	
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"models": models,
		"count":  len(models),
	})
}

func (s *Server) handleLoadModel(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Path         string `json:"path"`
		Format       string `json:"format"`
		Quantization int    `json:"quantization"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// TODO: Load model via Rust engine
	
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "loaded",
		"model":   req.Path,
		"format":  req.Format,
	})
}

func (s *Server) handleUnloadModel(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	modelID := vars["id"]
	
	// TODO: Unload model
	
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status": "unloaded",
		"model":  modelID,
	})
}

// Middleware
func (s *Server) authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiKey := r.Header.Get("Authorization")
		if apiKey != "Bearer "+s.config.APIKey {
			respondError(w, http.StatusUnauthorized, "Invalid API key")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
	})
}

func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})
	return c.Handler(next)
}

// Helper functions
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

func generateID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func formatChatMessages(messages []map[string]interface{}) string {
	var prompt string
	for _, msg := range messages {
		role := msg["role"].(string)
		content := msg["content"].(string)
		prompt += fmt.Sprintf("[%s]: %s\n", role, content)
	}
	return prompt
}

func (s *Server) Start() error {
	addr := ":" + s.config.Port
	
	srv := &http.Server{
		Addr:         addr,
		Handler:      s.router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		sigint := make(chan os.Signal, 1)
		signal.Notify(sigint, os.Interrupt, syscall.SIGTERM)
		<-sigint

		log.Println("Shutting down server...")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		
		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("Server shutdown error: %v", err)
		}
	}()

	log.Printf("🚀 InSystem Compute Gateway v%s listening on %s", Version, addr)
	return srv.ListenAndServe()
}

func main() {
	config := &Config{
		Port:        getEnv("PORT", DefaultPort),
		Device:      getEnv("DEVICE", "auto"),
		Threads:     8,
		MemoryLimit: 4 * 1024 * 1024 * 1024, // 4GB
		EnableAuth:  getEnv("ENABLE_AUTH", "false") == "true",
		APIKey:      getEnv("API_KEY", ""),
		HubRegistry: getEnv("HUB_REGISTRY", "../hub/registry.json"),
	}

	server, err := NewServer(config)
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}

	if err := server.Start(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server error: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// ===== Hub plumbing =====

func (s *Server) initHub() error {
	reg, err := hub.Load(s.config.HubRegistry)
	if err != nil { return err }
	s.hubReg = reg
	return nil
}

// Handlers
func (s *Server) hubListModels(w http.ResponseWriter, r *http.Request) {
	list := s.hubReg.List()
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"models": list,
		"count":  len(list),
	})
}

func (s *Server) hubGetModel(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	if m, ok := s.hubReg.Get(id); ok {
		respondJSON(w, http.StatusOK, m)
		return
	}
	respondError(w, http.StatusNotFound, "model not found")
}

func (s *Server) hubRegisterModel(w http.ResponseWriter, r *http.Request) {
	var m hub.ModelCard
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		respondError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if m.ID == "" {
		m.ID = generateID()
	}
	if m.CreatedAt.IsZero() {
		m.CreatedAt = time.Now()
	}
	if err := s.hubReg.Upsert(m); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusCreated, m)
}

func (s *Server) hubDownloadFile(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	filename := r.URL.Query().Get("file")
	m, ok := s.hubReg.Get(id)
	if !ok { respondError(w, http.StatusNotFound, "model not found"); return }
	var path string
	for _, f := range m.Files {
		if f.Filename == filename || filename == "" {
			path = f.Path
			if filename == "" { filename = f.Filename }
			break
		}
	}
	if path == "" { respondError(w, http.StatusNotFound, "file not found"); return }
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	http.ServeFile(w, r, path)
}
