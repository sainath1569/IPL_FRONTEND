import React, { useState, useEffect } from 'react';
import Navbar from '../components/navbar';
import '../styles/profile.css';

const Profile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    franchise: '',
    profilePicture: '',
    bio: '',
    username: ''
  });

  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = () => {
    setIsLoading(true);
    
    // Load from localStorage
    const savedProfile = localStorage.getItem('userProfile');
    const storedEmail = localStorage.getItem('email');
    const storedUsername = localStorage.getItem('username');

    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      // Ensure email and username from localStorage take priority
      setProfile({
        ...parsedProfile,
        email: storedEmail || parsedProfile.email,
        username: storedUsername || parsedProfile.username
      });
    } else {
      // Initialize with localStorage data
      const initialProfile = {
        name: storedUsername || 'User',
        email: storedEmail || '',
        phone: '',
        city: '',
        franchise: '',
        profilePicture: '',
        bio: '',
        username: storedUsername || ''
      };
      setProfile(initialProfile);
      localStorage.setItem('userProfile', JSON.stringify(initialProfile));
    }
    
    setIsLoading(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profilePicture: 'Please select an image file' }));
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profilePicture: 'Image size should be less than 2MB' }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          profilePicture: reader.result
        }));
        setErrors(prev => ({ ...prev, profilePicture: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!profile.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (profile.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (profile.phone && !/^\d{10}$/.test(profile.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (profile.bio && profile.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      const profileToSave = {
        ...profile,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem('userProfile', JSON.stringify(profileToSave));
      setIsEditing(false);
      setErrors({});
      
      // Show success message
      alert('Profile updated successfully!');
    } else {
      setErrors(newErrors);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      if (digits.length > 6) {
        formattedValue = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      } else if (digits.length > 3) {
        formattedValue = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      } else if (digits.length > 0) {
        formattedValue = `(${digits}`;
      } else {
        formattedValue = '';
      }
    }
    
    setProfile(prev => ({
      ...prev,
      [name]: formattedValue || value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCancel = () => {
    loadProfileData();
    setIsEditing(false);
    setErrors({});
  };

  const getInitials = (name) => {
    return name 
      ? name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-light">
        <Navbar />
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-light">
      <Navbar />
      <div className="profile-container">
        {/* Header Section */}
        <div className="profile-hero">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">My Profile</h1>
              <p className="hero-subtitle">Manage your personal information and preferences</p>
            </div>
            <div className="hero-actions">
              <button
                onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                className={`hero-btn ${isEditing ? 'hero-btn-cancel' : 'hero-btn-edit'}`}
              >
                {isEditing ? (
                  <>
                    <span className="btn-icon">×</span>
                    Cancel Editing
                  </>
                ) : (
                  <>
                    <span className="btn-icon">✎</span>
                    Edit Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-content">
          {/* Profile Card */}
          <div className="profile-card">
            <div className="card-header">
              <div className="header-icon">👤</div>
              <h2>Personal Information</h2>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              {/* Profile Picture Section */}
              <div className="picture-section">
                <div className="picture-container">
                  <div className="picture-wrapper">
                    {profile.profilePicture ? (
                      <img
                        src={profile.profilePicture}
                        alt="Profile"
                        className="profile-image"
                      />
                    ) : (
                      <div className="profile-avatar">
                        <span className="avatar-initials">{getInitials(profile.name)}</span>
                      </div>
                    )}
                    
                    {isEditing && (
                      <label className="image-upload-overlay">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <div className="upload-content">
                          <span className="upload-icon">📷</span>
                          <span className="upload-text">Change Photo</span>
                        </div>
                      </label>
                    )}
                  </div>
                  
                  <div className="picture-details">
                    <h3 className="user-name">{profile.name}</h3>
                    <p className="user-email">{profile.email}</p>
                    <p className="user-role">{profile.franchise || 'Campus Member'}</p>
                  </div>
                </div>
                
                {errors.profilePicture && (
                  <div className="error-message">{errors.profilePicture}</div>
                )}
              </div>

              {/* Form Grid */}
              <div className="form-sections">
                {/* Basic Information */}
                <div className="form-section">
                  <h3 className="section-title">Basic Information</h3>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">
                        Full Name *
                        {errors.name && <span className="required-dot"></span>}
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`form-input ${errors.name ? 'input-error' : ''}`}
                        placeholder="Enter your full name"
                      />
                      {errors.name && <div className="error-message">{errors.name}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Email Address
                        <span className="field-info">(Cannot be changed)</span>
                      </label>
                      <div className="readonly-field">
                        <span className="readonly-text">{profile.email}</span>
                        <span className="readonly-badge">Fixed</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Phone Number
                        {errors.phone && <span className="required-dot"></span>}
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`form-input ${errors.phone ? 'input-error' : ''}`}
                        placeholder="(123) 456-7890"
                      />
                      {errors.phone && <div className="error-message">{errors.phone}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Username
                        <span className="field-info">(Cannot be changed)</span>
                      </label>
                      <div className="readonly-field">
                        <span className="readonly-text">{profile.username}</span>
                        <span className="readonly-badge">Fixed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="form-actions">
                  <button
                    type="submit"
                    className="save-button"
                  >
                    <span className="save-icon">💾</span>
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;