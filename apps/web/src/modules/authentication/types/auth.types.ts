export interface LoginFormData {
  pin: string
  rememberDevice: boolean
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    user: {
      id: string
      name: string
      email: string
      role: string
    }
    token: string
  }
}

export interface AuthError {
  success: false
  message: string
  error: string
}
