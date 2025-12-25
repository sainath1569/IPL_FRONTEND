import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/Franchisecards.css';

const FranchiseCards = () => {
  const { auctionId } = useParams();
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`https://ipl-server-dsy3.onrender.com/api/auctionlive/${auctionId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch teams');
        }
        
        const data = await response.json();
        
        if (!data.teams || !Array.isArray(data.teams)) {
          throw new Error('Invalid teams data');
        }
        
        // Map the backend data to our frontend format
        const formattedTeams = data.teams.map(team => ({
          name: team.teamname || 'Unknown Team',
          shortName: getTeamInitials(team.teamname || 'Unknown Team'),
          logo: team.logo, // This now comes from backend as base64 URL or null
          website: team.website || '#',
          primaryColor: team.primaryColor || generateAttractiveColor(team.teamname, 'primary'),
          secondaryColor: team.secondaryColor || generateAttractiveColor(team.teamname, 'secondary'),
          email: team.email,
          phonenumber: team.phonenumber
        }));
        
        setTeams(formattedTeams);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError(err.message);
        // Fallback to default teams if available
        setTeams(getDefaultTeams());
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, [auctionId]);

  // Function to generate attractive color combinations based on team name
  const generateAttractiveColor = (teamName, type) => {
    if (!teamName) {
      return type === 'primary' ? '#3A225D' : '#B49C2F';
    }
    
    // Create a simple hash from the team name for consistent colors
    const hash = Array.from(teamName).reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Predefined attractive color combinations
    const colorPairs = [
      { primary: '#1E3A8A', secondary: '#F59E0B' }, // Navy & Amber
      { primary: '#047857', secondary: '#ECFDF5' },  // Emerald & Mint
      { primary: '#7C3AED', secondary: '#C4B5FD' }, // Violet & Light Violet
      { primary: '#DC2626', secondary: '#FEE2E2' }, // Red & Light Red
      { primary: '#0E7490', secondary: '#A5F3FC' }, // Teal & Cyan
      { primary: '#9333EA', secondary: '#E9D5FF' },  // Purple & Light Purple
      { primary: '#EA580C', secondary: '#FFEDD5' },  // Orange & Light Orange
      { primary: '#2563EB', secondary: '#BFDBFE' },  // Blue & Light Blue
    ];
    
    // Select a color pair based on the hash
    const pair = colorPairs[Math.abs(hash) % colorPairs.length];
    return pair[type];
  };

  // Function to get team initials
  const getTeamInitials = (name) => {
    if (!name) return 'TM';
    const words = name.split(' ');
    if (words.length === 1) return name.substring(0, 2).toUpperCase();
    return words.map(word => word[0]).join('').toUpperCase().substring(0, 2);
  };

  const getDefaultTeams = () => {
    // Fallback teams if API fails
    return [
      {
        name: 'Team Not Found',
        shortName: 'ERR',
        logo: null,
        website: '#',
        primaryColor: '#FF0000',
        secondaryColor: '#FFFFFF'
      }
    ];
  };

  const handleCardClick = (shortName) => {
    const teamName = teams.find(team => team.shortName === shortName)?.name;
    if (teamName) {
      navigate(`/franchise/?teamName=${teamName.replace(/\s+/g, '')}&auctionId=${auctionId}`);
    }
  };

  // Handle image load errors
  const handleImageError = (e) => {
    console.error('Logo failed to load:', e.target.src);
    e.target.style.display = 'none';
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
      }}>
        <div className="bouncing-dots">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        color: 'white'
      }}>
        <h2>Error Loading Teams</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#3A225D',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '2rem 1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem',
        color: 'white'
      }}>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: '800',
          background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem',
          textShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}>
          IPL Franchises
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: '#a0a0a0',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          Teams participating in this auction
        </p>
      </div>

      {/* Cards Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        {teams.map((team, index) => (
          <div
            key={`${team.shortName}-${index}`}
            onClick={() => handleCardClick(team.shortName)}
            onMouseEnter={() => setHoveredCard(team.shortName)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: hoveredCard === team.shortName 
                ? `linear-gradient(135deg, ${team.primaryColor}20, ${team.secondaryColor}20)`
                : 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: hoveredCard === team.shortName 
                ? `2px solid ${team.primaryColor}` 
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '2rem',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: hoveredCard === team.shortName ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: hoveredCard === team.shortName 
                ? `0 20px 40px rgba(0,0,0,0.3), 0 0 30px ${team.primaryColor}30`
                : '0 8px 25px rgba(0,0,0,0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                position: 'relative'
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${team.primaryColor}20, ${team.secondaryColor}20)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${team.primaryColor}30`,
                  transform: hoveredCard === team.shortName ? 'rotate(5deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}>
                  {team.logo ? (
                    <img 
                      src={team.logo}
                      alt={`${team.name} Logo`}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'contain',
                        filter: hoveredCard === team.shortName ? 'brightness(1.2)' : 'brightness(1)',
                        transition: 'filter 0.3s ease'
                      }}
                      onError={handleImageError}
                      onLoad={() => console.log('Logo loaded successfully for:', team.name)}
                    />
                  ) : null}
                  
                  {/* Fallback initials - always render but hide if logo loads successfully */}
                  <div 
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})`,
                      display: team.logo ? 'none' : 'flex', // Hide if logo exists
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '32px',
                      fontWeight: 'bold',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                    id={`fallback-${team.shortName}`}
                  >
                    {getTeamInitials(team.name)}
                  </div>
                </div>
              </div>

              <h3 style={{
                fontSize: '1.4rem',
                fontWeight: '700',
                color: 'white',
                textAlign: 'center',
                marginBottom: '1rem',
                lineHeight: '1.3'
              }}>
                {team.name}
              </h3>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  background: `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})`,
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '25px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  boxShadow: `0 4px 15px ${team.primaryColor}40`
                }}>
                  {team.shortName}
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: '600',
                opacity: hoveredCard === team.shortName ? 1 : 0.6,
                transform: hoveredCard === team.shortName ? 'translateX(5px)' : 'translateX(0)',
                transition: 'all 0.3s ease'
              }}>
                View Squad →
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate(`/live/${auctionId}`)}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          padding: '12px 24px',
          borderRadius: '50px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          border: 'none',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 12px 35px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
        }}
      >
        ← Back to Auction
      </button>
    </div>
  );
};

export default FranchiseCards;