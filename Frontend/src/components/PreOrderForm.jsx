import React, { useState } from 'react';
import axios from 'axios';
import API_BASE from '../config';
import './PreOrderForm.css'; // We'll create this CSS file
import pannabg from "../assets/pannabg.png";
import { toast } from "sonner";

const PreOrderForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    device: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Basic validation
    if (!formData.name || !formData.phone || !formData.device) {
      setError('Name, phone, and device are required fields');
      setLoading(false);
      return;
    }

    // Email validation - only if email is provided
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }
    }
    
    // Phone validation (basic - at least 10 digits)
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid phone number (at least 10 digits)');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/preorders`, formData);

       toast.success("Pre-order submitted successfully!", {
    description: "We'll contact you once the device is available.",
  });

      setSuccess(true);
        setSubmitted(true); 
      setFormData({

        name: '',
        email: '',
        phone: '',
        device: '',
      });
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error('Failed to submit pre-order:', error);
      setError(
        error.response?.data?.message || 
        'Failed to submit pre-order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="preorder-form-container">
      <div className="preorder-card">
        <h2>I want to Pre-order a Device</h2>
        <p className="description">
          Can't find what you're looking for? Tell us what device you want, 
          and we'll notify you when it becomes available!
        </p>
        
        {success && (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <div>
              <h3>Pre-order Submitted Successfully!</h3>
              <p>We'll contact you as soon as the device is available.</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="device">
              Device Name Or Description <span className="required">*</span>
            </label>
            <textarea
              id="device"
              name="device"
              value={formData.device}
              onChange={handleChange}
              required
              placeholder="Describe the device you want (e.g., Aeno, Canyon ,Samsung, 256GB, Deep Purple, or any specific requirements)"
              rows="5"
              disabled={loading}
            ></textarea>
            <div className="hint">
              Be as specific as possible - include brand, model, color, storage, etc.
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="name">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>
          
          
          
          <div className="form-group">
            <label htmlFor="phone">
              Phone Number <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="Enter your phone number"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              
              placeholder="Enter your email address"
              disabled={loading}
            />
          </div>
          
          
          
          <button 
            type="submit" 
            className="submit-btn"
            d disabled={loading || submitted}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Submitting...
              </>
            ) : (
              'Submit Pre-order'
            )}
          </button>
          
          <p className="privacy-note">
            Your information will only be used to contact you about this pre-order.
            We don't share your details with third parties.
          </p>
        </form>
      </div>
    </div>
  );
};

export default PreOrderForm;