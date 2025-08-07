// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/theme.css";
import loginpg1 from "../assets/loginpg-1.svg";
import loginpg2 from "../assets/loginpg-2.svg";
import dyLogo from "../assets/dy-logo.svg";
import userIcon from "../assets/user.svg";
import passwordIcon from "../assets/password.svg";
import viewIcon from "../assets/view.svg";
import passHideIcon from "../assets/pass-hide.svg";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error, clearError, getDashboardPath } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = location.state?.from?.pathname || getDashboardPath();
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state, getDashboardPath]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(formData);
      
      if (result.success) {
        // Navigation will be handled by the useEffect hook above
        console.log('Login successful:', result.user);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading spinner if checking authentication status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">


      {/* Top-left section with logo only */}
      <div className="university-branding">
        <img src={dyLogo} alt="DY Patil Logo" className="university-logo" />
      </div>

      {/* Left side - Login form */}
      <div className="login-form-section">
        <div className="login-form-container">
          <h2 className="login-title">LOGIN</h2>
          
          {/* Error message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <div className="input-icon">
                <img src={userIcon} alt="User" />
              </div>
                        <input
            type="email"
            name="email"
            placeholder="Email"
            className="login-input"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
            </div>
            
            <div className="input-group">
              <div className="input-icon">
                <img src={passwordIcon} alt="Password" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="login-input"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <img 
                  src={showPassword ? viewIcon : passHideIcon} 
                  alt={showPassword ? "Hide password" : "Show password"}
                  className="password-toggle-icon"
                />
              </button>
            </div>
            
          <button 
            type="submit" 
            className="login-button"
          >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging in...
                </span>
              ) : (
                'LOGIN'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right side - Illustrative graphics */}
      <div className="illustration-section">
        <img src={loginpg2} alt="Login Illustration" className="main-illustration" />
      </div>

      {/* Top-left illustration */}
      <div className="top-left-illustration">
        <img src={loginpg1} alt="Top Left Illustration" />
      </div>
    </div>
  );
};

export default Login;

// Add custom styles for the simplified login design
const styles = `
  .login-container {
    min-height: 100vh;
    display: flex;
    position: relative;
    overflow: hidden;
    background: white;
  }

  .university-branding {
    position: absolute;
    top: 4vh;
    left: 3vw;
    z-index: 10;
  }

  .university-logo {
    width: auto;
    height: 15vh;
  }

  .login-form-section {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 0;
    width: 50%;
    margin-left: -30vw;
    margin-top: 12vh;
  }

  .login-form-container {
    padding: 3rem;
    width: 100%;
    max-width: 400px;
  }

  .login-title {
    font-size: 1.4vw;
    font-weight: bold;
    color: #782c7d;
    margin-bottom: 2vh;
    text-align: center;
  }

  .error-message {
    background: #fee;
    border: 1px solid #fcc;
    color: #c33;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .input-group {
    position: relative;
    margin-bottom: 1.5vh;
  }

  .input-icon {
    position: absolute;
    left: 0;
    top: 0;
    width: auto;
    height: 100%;
    background: #8C1D40;
    border-radius: 2vw;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    padding: 0 2vw;
  }

  .input-icon img {
    width: 20px;
    height: 20px;
    filter: brightness(0) invert(1);
  }

  .login-input {
    width: 100%;
    padding: 0.5rem 1rem 0.5rem 6rem;
    border: 2px solid #C06C84;
    border-radius: 2rem;
    font-size: 1vw;
    background: white;
    transition: border-color 0.3s ease;
    box-sizing: border-box;
  }

  .login-input:focus {
    outline: none;
    border-color: #8C1D40;
  }

  .password-toggle {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #666;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: color 0.3s ease;
    z-index: 3;
  }

  .password-toggle:hover {
    color: #8C1D40;
  }

  .password-toggle:focus {
    outline: none;
    color: #8C1D40;
  }

  .password-toggle-icon {
    width: 18px;
    height: 18px;
    filter: brightness(0) saturate(100%) invert(40%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0.7) contrast(1);
    transition: filter 0.3s ease;
  }

  .password-toggle:hover .password-toggle-icon {
    filter: brightness(0) saturate(100%) invert(20%) sepia(100%) saturate(1000%) hue-rotate(300deg) brightness(0.8) contrast(1);
  }

  .login-button {
    width: 70%;
    padding: 0.4rem;
    background: #782c7d;
    color: white;
    border: none;
    border-radius: 2rem;
    font-size: 1.1rem;
    font-weight: medium;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin-left: auto;
    margin-right: auto;
    display: block;
  }

  .login-button:hover {
    background: #5B2C6F;
  }

  .test-instructions {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.8rem;
    color: #666;
  }

  .illustration-section {
    position: absolute;
    right: 0;
    bottom: 0;
    height: 70vh;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .illustration-section img {
    padding: 0;
    margin: 0;
    object-fit: contain;
  }

  .main-illustration {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .top-left-illustration {
    position: absolute;
    top: 0;
    left: 0;
    width: 30%;
    height: 30%;
    z-index: 5;
  }

  .top-left-illustration img {
    padding: 0;
    margin: 0;
  }
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
