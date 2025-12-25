import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, IndianRupee, Wallet } from 'lucide-react';
import '../styles/purses.css';

const FranchisePurses = () => {
  const [purses, setPurses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [auctionName, setAuctionName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { auctionId } = useParams(); // Get auctionId from URL params

  // Team colors mapping
  const teamColors = {};

  useEffect(() => {
    const fetchAuctionAndPurses = async () => {
      if (!auctionId) {
        setError('No auction ID provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');
      
      try {
        // First, fetch auction details to get teams and budget
        const auctionResponse = await fetch(`https://ipl-server-lake.vercel.app/api/auctionlive/${auctionId}`);
        if (!auctionResponse.ok) {
          throw new Error('Failed to fetch auction details');
        }
        const auctionData = await auctionResponse.json();
        
        setAuctionName(auctionData.auctionName);
        
        // Get all teams from the auction
        const teams = auctionData.teams || [];
        
        if (teams.length === 0) {
          setError('No teams found in this auction');
          setIsLoading(false);
          return;
        }

        // Fetch purse data for each team
        const pursesData = [];
        
        for (let team of teams) {
          try {
            const teamName = team.teamname.replace(/\s+/g, ''); // Remove spaces for API call
            const response = await fetch(
              `https://ipl-server-lake.vercel.app/api/auctionlive/franchise/${teamName}?auctionId=${auctionId}`
            );
            
            if (response.ok) {
              const teamData = await response.json();
              
              pursesData.push({
                team: team.teamname, // Use original team name for display
                teamKey: teamName, // Use processed name for color mapping
                spent: teamData.totalSpent || 0,
                remaining: teamData.remainingPurse || 0,
                playersCount: teamData.players ? teamData.players.length : 0,
                budgetPerTeam: teamData.budgetPerTeam || 0
              });
            } else {
              console.warn(`Failed to fetch data for team ${team.teamname}`);
              // Add team with zero values if API call fails
              pursesData.push({
                team: team.teamname,
                teamKey: teamName,
                spent: 0,
                remaining: 0,
                playersCount: 0,
                budgetPerTeam: 0
              });
            }
          } catch (teamError) {
            console.error(`Error fetching data for team ${team.teamname}:`, teamError);
            // Add team with zero values if there's an error
            pursesData.push({
              team: team.teamname,
              teamKey: team.teamname.replace(/\s+/g, ''),
              spent: 0,
              remaining: 0,
              playersCount: 0,
              budgetPerTeam: 0
            });
          }
        }
        
        setPurses(pursesData);
      } catch (err) {
        console.error('Error fetching auction and purse data:', err);
        setError('Failed to fetch auction data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAuctionAndPurses();
  }, [auctionId]);

  // Sort by remaining purse (highest first)
  const sortedPurses = [...purses].sort((a, b) => b.remaining - a.remaining);

  if (error) {
    return (
      <div className="purses-container">
        <div className="purses-header">
          <h1 className="purses-title">
            <Wallet size={36} className="purse-icon" />
            Error Loading Purses
          </h1>
          <p className="purses-subtitle">{error}</p>
        </div>
        <button 
          className="floating-back-button"
          onClick={() => navigate(`/live/${auctionId}`)}
        >
          <ArrowLeft size={20} />
          Back to Auction page
        </button>
      </div>
    );
  }

  return (
    <div className="purses-container">
      <div className="purses-header">
        <h1 className="purses-title">
          <Wallet size={36} className="purse-icon" />
          {auctionName ? `${auctionName} - Team Purses` : 'Team Purses'}
        </h1>
        <p className="purses-subtitle">Team Budgets & Spending Analysis</p>
      </div>

      {isLoading ? (
        <div className="bouncing-dots">
          <div></div>
          <div></div>
          <div></div>
        </div>
      ) : (
        <div className="purses-grid">
          {sortedPurses.map(({ team, teamKey, spent, remaining, playersCount, budgetPerTeam }) => {
            const maxPurse = budgetPerTeam || Math.max(spent + remaining, 1); // Prevent division by zero
const spentPercentage = maxPurse > 0 ? (spent / maxPurse) * 100 : 0;
            const remainingPercentage = 100 - (spentPercentage/100);
            
            // Try to get team color, fallback to a default color
            const teamColor = teamColors[teamKey] || teamColors[team] || '#6b7280';
            
            return (
              <div 
                key={team} 
                className="purse-card"
                style={{ borderTop: `4px solid ${teamColor}` }}
              >
                <div className="team-header">
                  <h2 className="team-name">{team}</h2>
                  <span className="team-players">{playersCount} players</span>
                </div>
                
                <div className="purse-progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${spentPercentage}%` }}
                  ></div>
                </div>
                
                <div className="purse-stats">
                  <div className="stat">
                    <div className="stat-label">Remaining</div>
                    <div className="stat-value remaining">
                      <IndianRupee size={16} />
                      {remaining.toLocaleString('en-IN')} L
                    </div>
                    <div className="stat-percentage">{remainingPercentage.toFixed(1)}%</div>
                  </div>
                  
                  <div className="stat">
                    <div className="stat-label">Spent</div>
                    <div className="stat-value spent">
                      <IndianRupee size={16} />
                      {spent.toLocaleString('en-IN')} 
                    </div>
                    <div className="stat-percentage">{spentPercentage.toFixed(1)}%</div>
                  </div>
                </div>

                {budgetPerTeam > 0 && (
                  <div className="team-budget-info">
                    <small style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Budget: ₹{budgetPerTeam.toLocaleString('en-IN')} L
                    </small>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button 
        className="floating-back-button"
        onClick={() => navigate(`/live/${auctionId}`)}
      >
        <ArrowLeft size={20} />
        Back to Auction page
      </button>
    </div>
  );
};

export default FranchisePurses;