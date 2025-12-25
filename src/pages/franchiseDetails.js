import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Users, DollarSign, TrendingUp, MapPin, Award, Star } from 'lucide-react';
import '../styles/FranchiseDetails.css';

const FranchiseDetails = () => {
  const { franchiseName } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
   const teamName = searchParams.get('teamName');
  const auctionId = searchParams.get('auctionId');
 

  
  const [data, setData] = useState({
    players: [],
    totalSpent: 0,
    remainingPurse: 0,
    budgetPerTeam: 100,
    auctionName: '',
    loading: true,
    error: null
  });

  const [selectedRole, setSelectedRole] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!auctionId) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Auction ID is required'
        }));
        return;
      }

      try {
        setData(prev => ({ ...prev, loading: true }));
        
        const response = await fetch(`https://ipl-server-dsy3.onrender.com/api/auctionlive/franchise/${teamName}?auctionId=${auctionId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch franchise data: ${response.status}`);
        }
        
        const franchiseData = await response.json();
        
        setData({
          players: franchiseData.players || [],
          totalSpent: franchiseData.totalSpent || 0,
          remainingPurse: franchiseData.remainingPurse || 0,
          budgetPerTeam: franchiseData.budgetPerTeam || 100,
          auctionName: franchiseData.auctionName || '',
          loading: false,
          error: null
        });
        
      } catch (err) {
        console.error('Error fetching franchise data:', err);
        setData({
          players: [],
          totalSpent: 0,
          remainingPurse: 0,
          budgetPerTeam: 100,
          auctionName: '',
          loading: false,
          error: err.message
        });
      }
    };

    fetchData();
  }, [franchiseName, auctionId]);

  // Filter players based on role and search term
  const filteredPlayers = data.players.filter(player => {
    const matchesRole = selectedRole === 'All' || player.Role === selectedRole;
    const matchesSearch = player['Player Name'].toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player['Country'].toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Get unique roles for filter
  const roles = ['All', ...new Set(data.players.map(player => player.Role))];

  // Calculate statistics
  const totalPlayers = data.players.length;
  const averagePrice = totalPlayers > 0 ? data.totalSpent / totalPlayers : 0;
  const mostExpensivePlayer = data.players.reduce((max, player) => 
    player['Sold Price'] > (max['Sold Price'] || 0) ? player : max, {});

  // Calculate purse utilization percentage
  const purseUtilization = data.budgetPerTeam > 0 ? ((data.totalSpent / data.budgetPerTeam) * 100).toFixed(1) : 0;

  if (data.loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading franchise data...</p>
        </div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Error Loading Data</h2>
          <p className="error-message">{data.error}</p>
          <button 
            onClick={() => navigate(-1)}
            className="error-button"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="franchise-details">
      {/* Header */}
      <div className="franchise-header">
        <div className="header-container">
          <div className="header-content">
            <button 
              onClick={() => navigate(-1)} 
              className="back-button"
            >
              <ArrowLeft className="back-icon" />
              <span>Back to Franchises</span>
            </button>
            <div className="header-stats">
              {totalPlayers} Players • ₹{data.totalSpent.toLocaleString('en-IN')} L Spent
              {data.auctionName && <span> • {data.auctionName}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="main-container">
        {/* Franchise Title */}
        <div className="franchise-title-section">
          <h1 className="franchise-title">
            {franchiseName} <span className="squad-text">Squad</span>
          </h1>
          <p className="franchise-subtitle">Team Overview & Player Statistics</p>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon-container blue">
                <DollarSign className="stat-icon" />
              </div>
              <div className="stat-info">
                <p className="stat-label1">Total Spent</p>
                <p className="stat-value">₹{data.totalSpent.toLocaleString('en-IN')} L</p>
                <p className="stat-subtitle">{purseUtilization}% of budget used</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon-container green">
                <TrendingUp className="stat-icon" />
              </div>
              <div className="stat-info">
                <p className="stat-label1">Remaining Purse</p>
                <p className="stat-value">₹{data.remainingPurse.toLocaleString('en-IN')} L</p>
                <p className="stat-subtitle">Out of ₹{data.budgetPerTeam.toLocaleString('en-IN')} L</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon-container purple">
                <Users className="stat-icon" />
              </div>
              <div className="stat-info">
                <p className="stat-label1">Total Players</p>
                <p className="stat-value">{totalPlayers}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon-container orange">
                <Award className="stat-icon" />
              </div>
              <div className="stat-info">
                <p className="stat-label1">Avg. Price</p>
                <p className="stat-value">₹{averagePrice.toFixed(1)} L</p>
              </div>
            </div>
          </div>
        </div>

        {/* Most Expensive Player Highlight */}
        {mostExpensivePlayer['Player Name'] && (
          <div className="expensive-player-card">
            <div className="expensive-player-content">
              <Star className="star-icon" />
              <div className="expensive-player-info">
                <h3 className="expensive-player-label">Most Expensive Player</h3>
                <p className="expensive-player-name">{mostExpensivePlayer['Player Name']}</p>
                <p className="expensive-player-price">₹{mostExpensivePlayer['Sold Price']?.toLocaleString('en-IN')} Lakhs</p>
                <p className="expensive-player-role">{mostExpensivePlayer['Role']} • {mostExpensivePlayer['Country']}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filters-container">
          <div className="filters-content">
            <div className="search-container">
              <label className="filter-label">Search Players</label>
              <input
                type="text"
                placeholder="Search by name or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="role-filter-container">
              <label className="filter-label">Filter by Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="role-select"
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Players Grid */}
        <div className="players-grid">
          {filteredPlayers.map((player, index) => (
            <div key={`${player.playerId}-${index}`} className="player-card">
              <div className="player-image-container">
                {player.Image ? (
                  <img
                    src={player.Image}
                    alt={player['Player Name']}
                    className="player-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200/f3f4f6/6b7280?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="player-image-placeholder">
                    <Users className="placeholder-icon" />
                  </div>
                )}
              </div>
              
              <div className="player-info">
                <h3 className="player-name">
                  {player['Player Name']}
                </h3>
                <p className="player-role">{player.Role}</p>
                
                <div className="player-details">
                  <div className="player-country">
                    <MapPin className="country-icon" />
                    <span className="country-text">{player.Country}</span>
                  </div>
                  
                  {player.Age && (
                    <div className="player-age">
                      <span className="age-text">Age: {player.Age}</span>
                    </div>
                  )}
                  
                  <div className="player-price-section">
                    <div className="price-row">
                      <span className="price-label">Base Price:</span>
                      <span className="base-price2">₹{player['Base Price'].toLocaleString('en-IN')} L</span>
                    </div>
                    <div className="price-row">
                      <span className="price-label">Sold Price:</span>
                      <span className="price-value">₹{player['Sold Price'].toLocaleString('en-IN')} L</span>
                    </div>
                  </div>
                  
                  {player['Previous Teams'] && player['Previous Teams'].length > 0 && (
                    <div className="previous-teams">
                      <span className="teams-label">Previous:</span>
                      <span className="teams-text">{player['Previous Teams'].join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPlayers.length === 0 && !data.loading && (
          <div className="empty-state">
            <Users className="empty-icon" />
            <h3 className="empty-title">
              {data.players.length === 0 ? 'No players purchased yet' : 'No players found'}
            </h3>
            <p className="empty-message">
              {data.players.length === 0 
                ? `${franchiseName} hasn't purchased any players in this auction yet.`
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FranchiseDetails;