import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, X, Check, ChevronDown, IndianRupee, Filter, 
  Search, ShieldAlert, ArrowLeft, Users
} from 'lucide-react';
import { Minus, Plus } from 'lucide-react';
import '../styles/createauction.css';
import Swal from 'sweetalert2';

const CreateAuction = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    auctionid: generateauctionid(),
    auctionname: '',
    auctiondate: '',
    auctiontime: '',
    place: '',
    phonenumber: '',
    maxteams: 8,
    maxplayersperteam: 25,
    budgetperteam: 100,
    entryfees: 0,
    rewardPrize: 0,
    scannerimage: null
  });

  // Player selection state
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);
  const [loading, setLoading] = useState({ main: false, players: false, count: false });
  const [error, setError] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    country: '',
    specialism: '',
    minPrice: '',
    maxPrice: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Generate random auction ID
  function generateauctionid() {
    return `AUCT_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  // Fetch player count on component mount
  useEffect(() => {
    const fetchPlayerCount = async () => {
      try {
        setLoading(prev => ({ ...prev, count: true }));
        const response = await fetch('https://ipl-server-lake.vercel.app/api/auction/getplayers');
        if (!response.ok) throw new Error('Failed to fetch player count');
        const data = await response.json();
        setPlayerCount(data.length);
      } catch (err) {
        console.error('Failed to fetch player count:', err);
        setPlayerCount(0);
      } finally {
        setLoading(prev => ({ ...prev, count: false }));
      }
    };

    fetchPlayerCount();
  }, []);

  // Handle search button click
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchQuery }));
  };

  // Fetch players with filters
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(prev => ({ ...prev, players: true }));
        setError('');
        
        const query = new URLSearchParams();
        if (filters.search) query.append('search', filters.search);
        if (filters.country) query.append('country', filters.country);
        if (filters.specialism) query.append('specialism', filters.specialism);
        if (filters.minPrice) query.append('minPrice', filters.minPrice);
        if (filters.maxPrice) query.append('maxPrice', filters.maxPrice);

        const response = await fetch(
          `https://ipl-server-lake.vercel.app/api/auction/getplayers?${query.toString()}`
        );
        
        if (!response.ok) throw new Error('Failed to fetch players');
        
        const data = await response.json();
        setPlayers(data);
        
        // Set all players as selected by default with base price
        const playersWithSelection = data.map(p => ({ 
          ...p, 
          selected: true, // Default selection
          base: p.base || 20 // Default base price if not provided
        }));
        
        setSelectedPlayers(playersWithSelection);
      } catch (err) {
        setError('Failed to load players. Please try again.');
        console.error(err);
      } finally {
        setLoading(prev => ({ ...prev, players: false }));
      }
    };

    if (showPlayerSelector) fetchPlayers();
  }, [showPlayerSelector, filters]);

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file input changes
  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, scannerimage: e.target.files[0] }));
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Toggle player selection
  const togglePlayerSelection = (playerId) => {
    setSelectedPlayers(prev =>
      prev.map(player =>
        player._id === playerId ? { ...player, selected: !player.selected } : player
      )
    );
  };

  // Update player base price
  const updateBasePrice = (playerId, price) => {
    if (price < 1) return;
    setSelectedPlayers(prev =>
      prev.map(player =>
        player._id === playerId ? { ...player, base: Number(price) } : player
      )
    );
  };

  // Select all players
  const selectAllPlayers = () => {
    setSelectedPlayers(prev =>
      prev.map(p => ({ ...p, selected: true }))
    );
  };

  // Deselect all players
  const deselectAllPlayers = () => {
    setSelectedPlayers(prev =>
      prev.map(p => ({ ...p, selected: false }))
    );
  };

  // Get selected players count
  const getSelectedCount = () => {
    return selectedPlayers.filter(p => p.selected).length;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, main: true }));
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Get user email from localStorage for createdby field
      const userEmail = localStorage.getItem('email');
      if (!userEmail) {
        throw new Error('User email not found. Please log in again.');
      }
      
      // Append all form data - ensure field names match backend exactly
      formDataToSend.append('auctionid', formData.auctionid);
      formDataToSend.append('auctionname', formData.auctionname);
      formDataToSend.append('auctiondate', formData.auctiondate);
      formDataToSend.append('auctiontime', formData.auctiontime);
      formDataToSend.append('phonenumber', formData.phonenumber);
      formDataToSend.append('place', formData.place);
      formDataToSend.append('maxteams', formData.maxteams.toString());
      formDataToSend.append('maxplayersperteam', formData.maxplayersperteam.toString());
      formDataToSend.append('budgetperteam', formData.budgetperteam.toString());
      formDataToSend.append('entryfees', formData.entryfees.toString());
      formDataToSend.append('rewardprize', formData.rewardPrize.toString());
      formDataToSend.append('createdby', userEmail);
      
      // Append players data
      const selectedPlayersData = selectedPlayers
        .filter(p => p.selected)
        .map(p => ({
          playerId: p.playerId,
          base: p.base || 0
        }));
      formDataToSend.append('players', JSON.stringify(selectedPlayersData));
      
      // Append scanner image if exists
      if (formData.scannerimage) {
        formDataToSend.append('scannerimage', formData.scannerimage);
      }

      const response = await fetch('https://ipl-server-lake.vercel.app/api/auction/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      // First check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.statusText}`);
      }

      // Mock success for demo
      await Swal.fire({
        icon: 'success',
        title: 'Auction Created!',
        text: 'Your auction has been successfully created.',
        confirmButtonText: 'OK'
      });
      navigate('/my-auctions');
      return;
    } catch (err) {
      let errorMessage = err.message;
      
      // Handle cases where the error might be HTML
      if (err.message.includes('<!DOCTYPE') || err.message.includes('<html>')) {
        errorMessage = 'Server error occurred. Please check your data and try again.';
      }
      
      setError(errorMessage);
      console.error('Submission error:', err);
    } finally {
      setLoading(prev => ({ ...prev, main: false }));
    }
  };

  // Filter players based on search term
  const filteredPlayers = selectedPlayers.filter(player =>
    player.name.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="create-auction-page">
      <div className="create-auction-container">
        {/* Header with Brand */}
        <div className="auction-header">
          <h1 className="brand-title">Mock Auction</h1>
          <p className="brand-subtitle">Premium Cricket Auction Platform</p>
        </div>

        <button onClick={handleBack} className="back-btn">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="auction-form-container">
          <div className="form-header">
            <h2 className="form-title">Create New Auction</h2>
            <p className="form-subtitle">Set up your cricket auction with custom rules and player selection</p>
          </div>
          
          {error && (
            <div className="error-message">
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Form fields - same as before */}
              <div className="form-group">
                <label>Auction ID</label>
                <input
                  type="text"
                  name="auctionid"
                  value={formData.auctionid}
                  onChange={handleInputChange}
                  required
                  readOnly
                  className="readonly-input"
                />
              </div>

              <div className="form-group">
                <label>Auction Name</label>
                <input
                  type="text"
                  name="auctionname"
                  value={formData.auctionname}
                  onChange={handleInputChange}
                  placeholder="Enter auction name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="auctiondate"
                  value={formData.auctiondate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  name="auctiontime"
                  value={formData.auctiontime}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>phonenumber</label>
                <input
                  type="text"
                  name="phonenumber"
                  value={formData.phonenumber}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div className="form-group">
                <label>Place</label>
                <input
                  type="text"
                  name="place"
                  value={formData.place}
                  onChange={handleInputChange}
                  placeholder="Enter venue location"
                  required
                />
              </div>

              <div className="form-group">
                <label>Max Teams</label>
                <input
                  type="number"
                  name="maxteams"
                  min="2"
                  max="10"
                  value={formData.maxteams}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Players Per Team</label>
                <input
                  type="number"
                  name="maxplayersperteam"
                  min="15"
                  max="30"
                  value={formData.maxplayersperteam}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Budget Per Team (₹ Cr)</label>
                <input
                  type="number"
                  name="budgetperteam"
                  min="50"
                  max="200"
                  step="5"
                  value={formData.budgetperteam}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group price-input-group">
                <label>Entry Fees (₹)</label>
                <div className="price-input-container">
                  <IndianRupee size={16} className="rupee-icon" />
                  <input
                    type="number"
                    name="entryfees"
                    min="0"
                    value={formData.entryfees}
                    onChange={handleInputChange}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group price-input-group">
                <label>Reward Prize (₹)</label>
                <div className="price-input-container">
                  <IndianRupee size={16} className="rupee-icon" />
                  <input
                    type="number"
                    name="rewardPrize"
                    min="0"
                    value={formData.rewardPrize}
                    onChange={handleInputChange}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Scanner Image</label>
                <input
                  type="file"
                  name="scannerimage"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="file-input"
                />
              </div>
            </div>

            {/* Enhanced Player Selection Section */}
            <div className="player-selection-section">
              <div className="section-header">
                <h3>Player Selection</h3>
                <div className="player-count-container">
                  <div className="player-count-badge">
                    <Users size={16} />
                    <span>
                      {loading.count ? (
                        <div className="mini-spinner">
                          <div className="spinner-dot"></div>
                          <div className="spinner-dot"></div>
                          <div className="spinner-dot"></div>
                        </div>
                      ) : (
                        `${playerCount} Available Players`
                      )}
                    </span>
                  </div>
                  {/* Selected Players Count Display */}
                  {showPlayerSelector && selectedPlayers.length > 0 && (
                    <div className="selected-count-badge">
                      <Check size={14} />
                      <span>{getSelectedCount()} Selected Players</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="option-buttons">
                <button
                  type="button"
                  className="option-btn secondary"
                  onClick={() => setShowPlayerSelector(!showPlayerSelector)}
                >
                  {showPlayerSelector ? <X size={18} /> : <ChevronDown size={18} />}
                  {showPlayerSelector ? 'Close Selector' : 'Select/Edit Players'}
                </button>
              </div>
            </div>

            {showPlayerSelector && (
              <div className="player-selector-widget">
                {loading.players ? (
                  <div className="enhanced-loading">
                    <div className="loading-animation">
                      <div className="pulse-circle"></div>
                      <div className="pulse-circle pulse-delay-1"></div>
                      <div className="pulse-circle pulse-delay-2"></div>
                    </div>
                    <h3>Loading Players...</h3>
                    <p>Fetching player data from database</p>
                  </div>
                ) : (
                  <>
                    <div className="player-filters">
                      <div className="filter-group search-group">
                        <input
                          type="text"
                          name="search"
                          placeholder="Search players..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button 
                          type="button" 
                          className="search-btn"
                          onClick={handleSearch}
                        >
                          <Search size={16} />
                        </button>
                      </div>
                      <div className="filter-group">
                        <select
                          name="country"
                          value={filters.country}
                          onChange={handleFilterChange}
                        >
                          <option value="">All Countries</option>
                          <option value="India">India</option>
                          <option value="Australia">Australia</option>
                          <option value="England">England</option>
                          <option value="South Africa">South Africa</option>
                          <option value="New Zealand">New Zealand</option>
                          <option value="West Indies">West Indies</option>
                          <option value="Pakistan">Pakistan</option>
                          <option value="Sri Lanka">Sri Lanka</option>
                          <option value="Bangladesh">Bangladesh</option>
                        </select>
                        <ChevronDown size={16} className="select-chevron" />
                      </div>
                      <div className="filter-group">
                        <select
                          name="specialism"
                          value={filters.specialism}
                          onChange={handleFilterChange}
                        >
                          <option value="">All Specialisms</option>
                          <option value="Batsman">Batsman</option>
                          <option value="Bowler">Bowler</option>
                          <option value="All-rounder">All-rounder</option>
                          <option value="Wicket-keeper">Wicket-keeper</option>
                        </select>
                        <ChevronDown size={16} className="select-chevron" />
                      </div>
                    </div>
                    
                    <div className="player-list-container">
                      <div className="selection-summary">
                        <div className="summary-info">
                          <span className="selected-count">
                            {getSelectedCount()} of {selectedPlayers.length} players selected
                          </span>
                          {getSelectedCount() > 0 && (
                            <span className="selection-status active">
                              ✓ Ready for Auction
                            </span>
                          )}
                        </div>
                        <div className="summary-actions">
                          <button
                            type="button"
                            className="action-btn select-all"
                            onClick={selectAllPlayers}
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            className="action-btn deselect-all"
                            onClick={deselectAllPlayers}
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>
                      
                      <div className="player-grid">
                        {filteredPlayers.map((player) => (
                          <div key={player._id} className={`player-card ${player.selected ? 'selected' : ''}`}>
                            <div className="player-card-header">
                              <div className="player-avatar">
                                <img
                                  src={player.image || '/api/placeholder/80/80'}
                                  alt={player.name}
                                  className="player-image1"
                                  onError={(e) => {
                                    const target = e.target ;
                                    target.src = '/api/placeholder/80/80';
                                  }}
                                />
                                {player.selected && (
                                  <div className="selected-indicator">
                                    <Check size={12} />
                                  </div>
                                )}
                              </div>
                              <div className="player-info">
                                <h4 className="player-name">{player.name}</h4>
                                <div className="player-meta">
                                  <span className="player-country1">{player.country}</span>
                                  <span className="player-specialism">{player.specialism}</span>
                                </div>
                              </div>
                            </div>

                            <div className="player-card-footer">
                              <div className="price-section">
                                <label className="price-label">Base Price</label>
                                <div className="price-display-group">
                                  <span className="price-value">{player.base || 20}</span>
                                  <span className="price-unit">Lakhs</span>
                                  <div className="price-adjust-buttons">
                                    <button
                                      type="button"
                                      className="price-adjust-btn decrease"
                                      onClick={() => updateBasePrice(player._id, Number(player.base) - 10 || 0)}
                                      disabled={!player.selected || (player.base || 0) <= 20}
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      className="price-adjust-btn increase"
                                      onClick={() => updateBasePrice(player._id, Number(player.base) + 10 || 0)}
                                      disabled={!player.selected || (player.base || 0) >= 200}
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              <button
                                type="button"
                                className={`select-toggle-btn ${player.selected ? 'selected' : ''}`}
                                onClick={() => togglePlayerSelection(player._id)}
                              >
                                {player.selected ? (
                                  <>
                                    <Check size={16} />
                                    Selected
                                  </>
                                ) : (
                                  <>
                                    <span className="plus-icon">+</span>
                                    Select
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {filteredPlayers.length === 0 && (
                        <div className="no-players">
                          <div className="no-players-icon">🏏</div>
                          <h3>No players found</h3>
                          <p>Try adjusting your filters to see more players</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={loading.main || getSelectedCount() === 0}
              >
                {loading.main ? (
                  <div className="loading-content">
                    <div className="spinner-ring"></div>
                    <span>Creating Auction...</span>
                  </div>
                ) : (
                  <>
                    <Save size={18} />
                    Create Auction ({getSelectedCount()} Players)
                  </>
                )}
              </button>
              
              {getSelectedCount() === 0 && showPlayerSelector && (
                <div className="selection-warning">
                  <ShieldAlert size={16} />
                  <span>Please select at least one player to create auction</span>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAuction;
