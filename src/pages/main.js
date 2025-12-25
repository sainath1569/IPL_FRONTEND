import React, { useState, useEffect, useCallback, useRef } from 'react';
import Swal from 'sweetalert2';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Plus, Minus, Users, Star, Award, IndianRupee, Hand } from 'lucide-react';
import io from 'socket.io-client';
import '../styles/main.css';

const Main = () => {
  const { auctionId } = useParams();
  const [players, setPlayers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUnsoldOnly, setShowUnsoldOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPriceUpdates, setPendingPriceUpdates] = useState(new Map());
  const [userRole, setUserRole] = useState('viewer');
  const [raisedHands, setRaisedHands] = useState([]);
  const [auction, setAuction] = useState(null);
  const [biddingHistory, setBiddingHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const socketRef = useRef(null);
  
  const navigate = useNavigate();

  // Generate dynamic team colors based on team names
  const generateTeamColor = (teamName) => {
    if (!teamName) return '#3b82f6';
    
    // Simple hash function to generate consistent colors
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
      hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert hash to HSL color with good saturation and lightness
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Debug: Log auctionId
  useEffect(() => {
    if (!auctionId) {
      console.error('No auctionId found in URL params');
      Swal.fire({
        title: 'Error!',
        text: 'No auction ID found in URL',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      }).then(() => {
        navigate('/'); // Redirect to home or auction list
      });
      return;
    }
  }, [auctionId, navigate]);

  useEffect(() => {
    if (!auctionId) return;

    const userEmail = localStorage.getItem('email');
    
    // Initialize WebSocket connection
    socketRef.current = io('https://ipl-server-dsy3.onrender.com', {
      query: { auctionId, userEmail }
    });

    // Set up WebSocket listeners - FIXED to use playerId
    socketRef.current.on('priceUpdate', ({ playerId, newPrice }) => {
      updatePlayerState(playerId, newPrice);
    });

    // NEW: Listen for player navigation changes
    socketRef.current.on('playerChanged', ({ newIndex, showUnsoldOnly: newShowUnsoldOnly }) => {
      setCurrentIndex(newIndex);
      setShowUnsoldOnly(newShowUnsoldOnly);
      setRaisedHands([]); // Clear raised hands when player changes
    });

    socketRef.current.on('handRaised', ({ teamName, playerId }) => {
      setRaisedHands(prev => [...prev, { teamName, playerId }]);
    });

    socketRef.current.on('handLowered', ({ teamName, playerId }) => {
      setRaisedHands(prev => prev.filter(h => 
        !(h.teamName === teamName && h.playerId === playerId)
      ));
    });

    socketRef.current.on('playerSold', ({ playerId, franchise, soldPrice }) => {
      setPlayers(prev => prev.map(p => 
        p.playerId === playerId ? { ...p, status: 'Sold', franchise } : p
      ));
      setRaisedHands([]); // Clear raised hands when player is sold
      // Refresh bidding history when a player is sold
      fetchBiddingHistory();
    });

    socketRef.current.on('playerUnsold', ({ playerId, basePrice }) => {
      setPlayers(prev => prev.map(p => 
        p.playerId === playerId ? { ...p, status: 'Unsold', franchise: '', soldPrice: basePrice } : p
      ));
      // Refresh bidding history when a player is marked unsold
      fetchBiddingHistory();
    });

    fetchAllData();

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [auctionId, userRole]);

  const fetchBiddingHistory = async () => {
    if (!auctionId) return;
    
    setIsHistoryLoading(true);
    try {
      const response = await fetch(`https://ipl-server-dsy3.onrender.com/api/auctionlive/biddinghistory/${auctionId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bidding history: ${response.status}`);
      }
      
      const historyData = await response.json();
      setBiddingHistory(historyData);
    } catch (error) {
      console.error('Error fetching bidding history:', error);
      setBiddingHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const fetchAllData = async () => {
    if (!auctionId) {
      console.error('No auctionId available for fetching data');
      return;
    }

    setIsLoading(true);
    try {
      const userEmail = localStorage.getItem('email');
      
      const [auctionRes, allPlayersRes] = await Promise.all([
        fetch(`https://ipl-server-dsy3.onrender.com/api/auctionlive/${auctionId}`),
        fetch(`https://ipl-server-dsy3.onrender.com/api/auctionlive/${auctionId}/players`)
      ]);
      
      // Check if responses are successful
      if (!auctionRes.ok) {
        throw new Error(`Failed to fetch auction: ${auctionRes.status}`);
      }
      if (!allPlayersRes.ok) {
        throw new Error(`Failed to fetch players: ${allPlayersRes.status}`);
      }

      const auctionData = await auctionRes.json();
      const allPlayers = await allPlayersRes.json();
      
      setAuction(auctionData);
      
      // Determine user role
      if (auctionData.createdby === userEmail) {
        setUserRole('organizer');
      } else if (auctionData.teams && auctionData.teams.some(team => team.email === userEmail)) {
        setUserRole('bidder');
      } else {
        setUserRole('viewer');
      }
      
      setPlayers(allPlayers);
      
      // Fetch bidding history after setting up auction data
      await fetchBiddingHistory();
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to load auction data',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (!filteredPlayers[currentIndex]) return;
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
    
    // Only allow key controls for organizer
    if (userRole !== 'organizer') return;
    
    switch(e.key) {
      case 'ArrowUp':
        updatePriceOptimized(filteredPlayers[currentIndex].playerId, 'increase');
        break;
      case 'ArrowDown':
        updatePriceOptimized(filteredPlayers[currentIndex].playerId, 'decrease');
        break;
      case 'ArrowLeft':
        showPrevious();
        break;
      case 'ArrowRight':
      case 'Enter':
        showNext();
        break;
      default:
        break;
    }
  };

  const formatPrice = (price) => {
    return price ? new Intl.NumberFormat('en-IN').format(price) : '0';
  };

  // FIXED: Updated to use playerId instead of playerName
  const updatePriceOptimized = useCallback((playerId, action) => {
    if (userRole !== 'organizer') return;

    const currentPlayer = players.find(p => p.playerId === playerId);
    if (!currentPlayer) return;

    const basePrice = currentPlayer.basePrice || 0;
    let currentPrice = currentPlayer.soldPrice || basePrice;
    let increment = getIncrement(currentPrice);

    let newPrice = calculateNewPrice(currentPrice, basePrice, action, increment);

    // Optimistic UI update
    updatePlayerState(playerId, newPrice);

    // Emit price update via WebSocket
    socketRef.current.emit('updatePrice', {
      auctionId,
      playerId,
      action,
      newPrice
    });

    // Debounce API call
    debouncePriceUpdate(playerId, action, newPrice);
  }, [players, userRole, auctionId]);

  const getIncrement = (price) => {
    if (price >= 500) return 50;
    if (price >= 100) return 25;
    return 10;
  };

  const calculateNewPrice = (current, base, action, increment) => {
    if (action === 'increase') return current + increment;
    
    const possibleReductions = [50, 25, 10].filter(i => i <= current - base);
    return possibleReductions.length > 0 
      ? current - Math.max(...possibleReductions)
      : base;
  };

  // FIXED: Updated to use playerId
  const updatePlayerState = (playerId, newPrice) => {
    setPlayers(prev => prev.map(p => 
      p.playerId === playerId ? { ...p, soldPrice: newPrice } : p
    ));
  };

  // FIXED: Updated to use playerId
  const debouncePriceUpdate = (playerId, action, newPrice) => {
    setPendingPriceUpdates(prev => new Map(prev).set(playerId, { action, newPrice }));

    const timeoutId = setTimeout(() => {
      sendPriceUpdateToServer(playerId, action, newPrice);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // FIXED: Updated to use playerId
  const sendPriceUpdateToServer = async (playerId, action, newPrice) => {
    try {
      const response = await fetch(`https://ipl-server-dsy3.onrender.com/api/auctionlive/${auctionId}/players/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, action, newPrice }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update price: ${response.status}`);
      }
      
      const updatedPlayer = await response.json();
      
      updatePlayerState(updatedPlayer.playerId, updatedPlayer.soldPrice);
      
      setPendingPriceUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(playerId);
        return newMap;
      });
    } catch (error) {
      console.error('Error updating price:', error);
    }
  };

  // FIXED: Updated to use playerId
  const assignFranchise = async (playerId, franchise) => {
    if (userRole !== 'organizer') return;

    try {
      const currentPlayer = players.find(p => p.playerId === playerId);
      if (!currentPlayer) return;

      const soldPrice = currentPlayer.soldPrice || currentPlayer.basePrice || 0;

      // Emit via WebSocket first for real-time update
      socketRef.current.emit('sellPlayer', {
        auctionId,
        playerId,
        franchise,
        soldPrice
      });

      const response = await fetch(`https://ipl-server-dsy3.onrender.com/api/auctionlive/${auctionId}/players/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, franchise, soldPrice }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to sell player: ${response.status}`);
      }
      
      const updatedPlayer = await response.json();
      
      setPlayers(prev => prev.map(p => 
        p.playerId === updatedPlayer.playerId 
          ? { ...p, status: 'Sold', franchise } 
          : p
      ));

      await Swal.fire({
        title: 'Sold!',
        html: `<div>
          <p>${currentPlayer.playerName} sold to <strong style="color: ${generateTeamColor(franchise)}">${franchise}</strong></p>
          <p>For <strong>₹${formatPrice(soldPrice)} Lakhs</strong></p>
        </div>`,
        icon: 'success',
        confirmButtonColor: generateTeamColor(franchise),
        background: '#1e293b',
        color: '#ffffff'
      });

      showNext();
    } catch (error) {
      console.error('Error assigning franchise:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to assign franchise',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  // FIXED: Updated to use playerId
  const markUnsold = async (playerId) => {
    if (userRole !== 'organizer') return;

    try {
      const currentPlayer = players.find(p => p.playerId === playerId);
      if (!currentPlayer) return;

      // Emit via WebSocket first
      socketRef.current.emit('markUnsold', { auctionId, playerId });

      const response = await fetch(`https://ipl-server-dsy3.onrender.com/api/auctionlive/${auctionId}/players/unsold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark unsold: ${response.status}`);
      }
      
      const updatedPlayer = await response.json();
      
      setPlayers(prev => prev.map(p => 
        p.playerId === updatedPlayer.playerId 
          ? { ...p, status: 'Unsold', franchise: '', soldPrice: updatedPlayer.basePrice } 
          : p
      ));

      await Swal.fire({
        title: 'Unsold!',
        text: `${currentPlayer.playerName} marked as unsold. New base price: ₹${formatPrice(updatedPlayer.basePrice)} Lakhs`,
        icon: 'info',
        confirmButtonColor: '#f59e0b',
        background: '#1e293b',
        color: '#ffffff'
      });

      showNext();
    } catch (error) {
      console.error('Error marking unsold:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to mark player as unsold',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  // FIXED: Updated to use playerId
  const toggleHandRaise = async (playerId) => {
    if (userRole !== 'bidder') return;

    try {
      const userEmail = localStorage.getItem('email');
      const currentPlayer = players.find(p => p.playerId === playerId);
      if (!currentPlayer || !auction) return;

      const userTeam = auction.teams.find(team => team.email === userEmail);
      if (!userTeam) return;

      // Check if THIS user's team has raised hand for this player
      const isHandRaised = raisedHands.some(
        h => h.teamName === userTeam.teamname && h.playerId === playerId
      );

      if (isHandRaised) {
        socketRef.current.emit('lowerHand', {
          auctionId,
          playerId,
          team: userTeam.teamname
        });
      } else {
        socketRef.current.emit('raiseHand', {
          auctionId,
          playerId,
          team: userTeam.teamname
        });
      }
    } catch (error) {
      console.error('Error toggling hand raise:', error);
    }
  };

  // MODIFIED: Emit player change events for real-time sync
  const showNext = () => {
    if (filteredPlayers.length > 0) {
      const newIndex = (currentIndex + 1) % filteredPlayers.length;
      setCurrentIndex(newIndex);
      
      // Clear raised hands when moving to next player
      setRaisedHands([]);
      
      // NEW: Emit player change for real-time sync (only organizer controls navigation)
      if (userRole === 'organizer' && socketRef.current) {
        socketRef.current.emit('changePlayer', {
          auctionId,
          newIndex,
          showUnsoldOnly
        });
      }
    }
  };

  const showPrevious = () => {
    if (filteredPlayers.length > 0) {
      const newIndex = (currentIndex - 1 + filteredPlayers.length) % filteredPlayers.length;
      setCurrentIndex(newIndex);
      
      // Clear raised hands when moving to previous player
      setRaisedHands([]);
      
      // NEW: Emit player change for real-time sync (only organizer controls navigation)
      if (userRole === 'organizer' && socketRef.current) {
        socketRef.current.emit('changePlayer', {
          auctionId,
          newIndex,
          showUnsoldOnly
        });
      }
    }
  };

  const toggleUnsoldView = () => {
    setCurrentIndex(0);
    const newShowUnsoldOnly = !showUnsoldOnly;
    setShowUnsoldOnly(newShowUnsoldOnly);
    
    // NEW: Emit view change for real-time sync (only organizer controls view)
    if (userRole === 'organizer' && socketRef.current) {
      socketRef.current.emit('changePlayer', {
        auctionId,
        newIndex: 0,
        showUnsoldOnly: newShowUnsoldOnly
      });
    }
  };

  // FIXED: Proper filtering logic - filter based on status
  const filteredPlayers = showUnsoldOnly 
    ? players.filter(player => player.status === 'Unsold' || player.status === 'Available' || !player.status)
    : players;
    
  const currentPlayer = filteredPlayers[currentIndex] || {};

  if (isLoading) {
    return (
      <div className="bouncing-dots">
        <div></div>
        <div></div>
        <div></div>
      </div>
    );
  }

  if (!auctionId) {
    return (
      <div className="main-container">
        <div className="empty-state">
          <h3>Invalid Auction</h3>
          <p>No auction ID found in the URL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <div className="background-overlay"></div>
      
      <h1 className="auction-title">{auction?.auctionName || 'Auction'}</h1>   
      
      <div className="utility-buttons">
        <button 
          onClick={() => navigate(`/auctionteamcards/${auctionId}`)} 
          className="results-btn"
        >
          Team Results
        </button>
        <button 
          onClick={() => navigate(`/teampurses/${auctionId}`)} 
          className="purses-btn"
        >
          Team Purses
        </button>
      </div>
      
      {filteredPlayers.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>No players found</h3>
          <p>{showUnsoldOnly ? 'All players have been sold!' : 'No players available'}</p>
        </div>
      ) : (
        <div className="player-display">
          <div className="player-card1">
            {currentPlayer.status === 'Sold' && (
              <div className="player-status sold-status">
                SOLD TO {currentPlayer.franchise}
              </div>
            )}
            {(currentPlayer.status === 'Unsold' || currentPlayer.status === 'Available') && (
              <div className="player-status unsold-status">
                {currentPlayer.status === 'Unsold' ? 'UNSOLD' : 'AVAILABLE'}
              </div>
            )}
            
            <div className="player-image-container">
              <img 
                src={currentPlayer.image || 'https://via.placeholder.com/300x300?text=No+Image'} 
                alt={currentPlayer.playerName} 
                className="player-img" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                }}
              />
              <div className="player-price-tag">
                <IndianRupee size={18} /> {formatPrice(currentPlayer.soldPrice || currentPlayer.basePrice)} L
              </div>
            </div>
            
            <div className="player-info">
              <h2 className="player-name">{currentPlayer.playerName}</h2>
              <div className="player-details">
                <p><strong>Age:</strong> {currentPlayer.age || 'N/A'}</p>
                <p><strong>Country:</strong> {currentPlayer.country || 'N/A'}</p>
                <p><strong>Role:</strong> {currentPlayer.role || 'N/A'}</p>
                <p><strong>Base Price:</strong> ₹{formatPrice(currentPlayer.basePrice)} Lakhs</p>
              </div>
              
              {/* Price controls - FIXED to use playerId */}
              {userRole === 'organizer' ? (
                <div className="price-controls">
                  <button 
                    onClick={() => updatePriceOptimized(currentPlayer.playerId, 'decrease')}
                    className="price-btn decrease-btn"
                    disabled={(currentPlayer.soldPrice || currentPlayer.basePrice) <= currentPlayer.basePrice}
                  >
                    <Minus size={24} />
                  </button>
                  
                  <span className="price-value1">
                    ₹{formatPrice(currentPlayer.soldPrice || currentPlayer.basePrice)} L
                  </span>
                  
                  <button 
                    onClick={() => updatePriceOptimized(currentPlayer.playerId, 'increase')}
                    className="price-btn increase-btn"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              ) : (
                <div className="current-bid-display">
                  <h4>Current Bid:</h4>
                  <div className="bid-amount">
                    <IndianRupee size={20} /> {formatPrice(currentPlayer.soldPrice || currentPlayer.basePrice)} Lakhs
                  </div>
                </div>
              )}

              {/* Hand raise button - FIXED to use playerId */}
              {userRole === 'bidder' && auction && (
                <button
                  onClick={() => toggleHandRaise(currentPlayer.playerId)}
                  className={`hand-raise-btn ${
                    raisedHands.some(h => {
                      const userTeam = auction.teams.find(team => team.email === localStorage.getItem('email'));
                      return h.playerId === currentPlayer.playerId && h.teamName === userTeam?.teamname;
                    }) ? 'raised' : ''
                  }`}
                >
                  <Hand size={18} />
                  {raisedHands.some(h => {
                    const userTeam = auction.teams.find(team => team.email === localStorage.getItem('email'));
                    return h.playerId === currentPlayer.playerId && h.teamName === userTeam?.teamname;
                  }) ? 'Lower Hand' : 'Raise Hand'}
                </button>
              )}

              {raisedHands.length > 0 && raisedHands.some(hand => hand.playerId === currentPlayer.playerId) && (
  <div className="raised-hands-container">
    <h4>Interested Teams:</h4>
    <div className="raised-hands-list">
      {raisedHands
        .filter(hand => hand.playerId === currentPlayer.playerId)
        .map((hand, index) => {
          const isCurrentUserTeam = auction?.teams?.some(
            team => team.teamname === hand.teamName && team.email === localStorage.getItem('email')
          );
          
          return (
            <div 
              key={index} 
              className={`team-badge ${isCurrentUserTeam ? 'current-user-team' : ''}`}
              style={{ 
                backgroundColor: generateTeamColor(hand.teamName),
                borderColor: generateTeamColor(hand.teamName),
                opacity: isCurrentUserTeam ? 1 : 0.8,
              }}
              title={hand.teamName}
            >
              {hand.teamName.substring(0, 2).toUpperCase()}
              {isCurrentUserTeam && (
                <span className="you-badge">YOU</span>
              )}
            </div>
          );
        })}
    </div>
  </div>
)}
              
              {/* Modified navigation buttons - only show for organizer */}
              {userRole === 'organizer' && (
                <div className="nav-buttons">
                  <button onClick={showPrevious} className="nav-btn prev-btn">
                    <ArrowLeft size={18} /> Previous
                  </button>
                  <span className="player-count">
                    {currentIndex + 1} / {filteredPlayers.length}
                  </span>
                  <button onClick={showNext} className="nav-btn next-btn">
                    Next <ArrowRight size={18} />
                  </button>
                </div>
              )}
              
              {/* For non-organizers, show player count without navigation buttons */}
              {userRole !== 'organizer' && (
                <div className="player-count-display">
                  <span className="player-count">
                    {currentIndex + 1} / {filteredPlayers.length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {userRole !== 'organizer' ? (
  <div className="history-container">
    <div className="history-card">
      <h3 className="history-title">BIDDING HISTORY</h3>
      <div className="history-messages">
        {isHistoryLoading ? (
          <div className="history-loading">Loading history...</div>
        ) : biddingHistory.length > 0 ? (
          // Sort by timestamp ascending to show most recent at bottom
          biddingHistory
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .slice(-10) // Show only last 10 entries
            .map((entry, index) => (
              <div key={index} className="message-bubble">
                <div className="message-content">
                  <span className="message-text">
                    <strong>{entry.playerName}</strong> was {entry.teamName === 'UNSOLD' ? 'marked as unsold' : `sold to ${entry.teamName}`} at ₹{formatPrice(entry.bidAmount)} L
                  </span>
                  <span className="message-time">
                    {new Date(entry.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            ))
        ) : (
          <div className="history-empty">No bidding history yet</div>
        )}
      </div>
    </div>
  </div>

          ) : (          
            userRole === 'organizer' && auction?.teams && (
              <div className="franchise-buttons-container">
                <div className="franchise-buttons">
                  <h3 className="franchise-title">ASSIGN TO TEAM</h3>
                  <div className="team-buttons-grid">
                    {auction.teams.map(team => (
                      <button 
                        key={team._id || team.teamname}
                        onClick={() => assignFranchise(currentPlayer.playerId, team.teamname)}
                        className="team-btn"
                        style={{ 
                          backgroundColor: generateTeamColor(team.teamname),
                          border: `2px solid ${generateTeamColor(team.teamname)}`,
                          color: '#ffffff'
                        }}
                      >
                        {team.teamname}
                      </button>
                    ))}
                  </div>
                  
                  <div className="action-buttons">
                    <button 
                      onClick={() => markUnsold(currentPlayer.playerId)}
                      className="unsold-btn"
                    >
                      <Star size={18} /> Mark Unsold
                    </button>
                    <button 
                      onClick={toggleUnsoldView} 
                      className="view-toggle-btn"
                    >
                      <Users size={18} /> {showUnsoldOnly ? 'Show All Players' : 'Show Unsold Only'}
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};


export default Main;
