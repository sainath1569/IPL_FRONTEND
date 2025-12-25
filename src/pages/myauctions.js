import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Calendar, MapPin, Users, Trophy, IndianRupee, 
  Edit, ArrowLeft, Search, Filter, Play, StopCircle,
  Clock, TrendingUp, Target, AlertCircle, Eye, X, User,
  FileText, Check, XCircle, Image, ExternalLink
} from 'lucide-react';
import '../styles/myauctions.css';
import Navbar from '../components/navbar';

const MyAuctions = () => {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [screenshotModal, setScreenshotModal] = useState({ show: false, url: '' });

  useEffect(() => {
    fetchMyAuctions();
  }, []);

  const fetchMyAuctions = async () => {
    try {
      setLoading(true);
      const userEmail = localStorage.getItem('email');
      
      if (!userEmail) {
        navigate('/login');
        return;
      }

      const response = await fetch(`https://ipl-server-lake.vercel.app/api/auction/getallauctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ createdby: userEmail })
      });

      if (response.ok) {
        const data = await response.json();
        setAuctions(data);
      } else {
        console.error('Failed to fetch auctions');
        setAuctions([]);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

 const fetchRequests = async (auction) => {
  try {
    setRequestsLoading(true);
    
    // Use the string auctionid, not the MongoDB _id
    const auctionid = auction.auctionid; // This is the string ID like "AUC001"
    
    // Fix: Use query parameters for GET request, not body
    const response = await fetch(`https://ipl-server-lake.vercel.app/api/auction/getrequests?auctionid=${encodeURIComponent(auctionid)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
      // No body for GET requests
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Requests data:', data); // Debug log
      setRequests(data || []); // Backend returns array directly, not { requests: [] }
    } else {
      console.error('Failed to fetch requests', response.status);
      setRequests([]);
    }
  } catch (error) {
    console.error('Error fetching requests:', error);
    setRequests([]);
  } finally {
    setRequestsLoading(false);
  }
};
  const handleApproveRequest = async (requestId, auctionid) => {
    try {
      // Find the request object to get the email
      const approvedRequest = requests.find(r => r._id === requestId);
      if (!approvedRequest || !approvedRequest.email) {
        alert('Could not find the request email.');
        return;
      }

      const response = await fetch(`https://ipl-server-lake.vercel.app/api/auction/approve-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ requestId, auctionid, email: approvedRequest.email }) 
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update local state - remove approved request
          setRequests(prev => prev.filter(req => req._id !== requestId));
          
          // Update auctions state - add team to the auction
          setAuctions(prevAuctions => 
            prevAuctions.map(auction => {
              if (auction.auctionid === auctionid) {
                if (approvedRequest) {
                  const newTeam = {
                    teamname: approvedRequest.teamname,
                    teamlogo: approvedRequest.teamlogo,
                    phonenumber: approvedRequest.phonenumber
                  };
                  return {
                    ...auction,
                    teams: [...(auction.teams || []), newTeam]
                  };
                }
              }
              return auction;
            })
          );
          
          alert('Team approved and added to auction!');
        } else {
          alert(result.message || 'Approval failed');
        }
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      console.error('Approval error:', error);
      alert('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await fetch(`https://ipl-server-lake.vercel.app/api/auction/reject-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requestId })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Remove the rejected request from the list
          setRequests(prevRequests => 
            prevRequests.filter(request => request._id !== requestId)
          );
          alert('Request rejected successfully!');
        } else {
          alert(result.message || 'Failed to reject request');
        }
      } else {
        alert('Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request');
    }
  };

  const handleCreateAuction = () => {
    navigate('/create-auction');
  };

  const handleEditAuction = (auctionId) => {
    navigate(`/edit-auction/${auctionId}`);
  };

  const handleViewTeams = (auction) => {
    setSelectedAuction(auction);
    setShowTeamsModal(true);
  };

  const handleViewRequests = async (auction) => {
  setSelectedAuction(auction);
  setShowRequestsModal(true);
  await fetchRequests(auction); // Pass the entire auction object
};

  const closeTeamsModal = () => {
    setShowTeamsModal(false);
    setSelectedAuction(null);
  };

  const closeRequestsModal = () => {
    setShowRequestsModal(false);
    setSelectedAuction(null);
    setRequests([]);
  };

  const handleViewScreenshot = (screenshotUrl) => {
    setScreenshotModal({ show: true, url: screenshotUrl });
  };

  const closeScreenshotModal = () => {
    setScreenshotModal({ show: false, url: '' });
  };

  const handleStatusUpdate = async (auctionId, newStatus) => {
  const confirmationMessages = {
    ongoing: 'Are you sure you want to start this auction? Once started, it cannot be reverted to upcoming status.',
    completed: 'Are you sure you want to mark this auction as completed?',
  };

  if (confirmationMessages[newStatus] && !window.confirm(confirmationMessages[newStatus])) {
    return;
  }

  try {
    const response = await fetch(`https://ipl-server-lake.vercel.app/api/auction/update-status/${auctionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization if needed
        // 'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    // First check if the response is OK
    if (!response.ok) {
      // Handle HTML error responses (like 404 pages)
      if (response.headers.get('content-type')?.includes('text/html')) {
        const errorText = await response.text();
        throw new Error(`Server returned HTML error: ${errorText.substring(0, 100)}...`);
      }
      
      // Try to parse JSON error
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } catch (e) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const result = await response.json();

    if (result.success) {
      // Update local state
      setAuctions(prevAuctions => 
        prevAuctions.map(auction =>
          auction._id === auctionId ? { ...auction, status: newStatus } : auction
        )
      );
      
      // Show success notification
      alert(`Auction status updated to ${newStatus} successfully`);
      
      // Special handling for ongoing auctions
      if (newStatus === 'ongoing') {
      
        navigate(`/live/${auctionId}`);
      }
    } else {
      alert(result.message || `Failed to update status to ${newStatus}`);
    }
  } catch (error) {
    console.error(`Status update error (${newStatus}):`, error);
    alert(`Error: ${error.message}`);
  }
};
  
  const getStatusBadge = (auction) => {
    const status = auction.status;
    if (status === 'upcoming') {
      return <span className="status-badge upcoming">Upcoming</span>;  
    } else if (status === 'ongoing') {
      return <span className="status-badge live">Live</span>;
    } else if (status === 'completed') {
      return <span className="status-badge completed">Completed</span>;
    } else if (status === 'cancelled') {
      return <span className="status-badge cancelled">Cancelled</span>;
    } else {
      return <span className="status-badge unknown">Unknown</span>;
    }
  };

  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = auction.auctionname.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    return matchesSearch && auction.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="my-auctions-page">
        <div className="loading-container3">
          <div className="loading-spinner">
          </div>
          <h3>Loading Your Auctions...</h3>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
    <div className="my-auctions-page">
      <div className="auctions-container">
        <div className="auctions-header">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          
          <div className="header-content">
            <div className="header-info">
              <h1 className="page-title1">My Auctions</h1>
              <p className="page-subtitle1">Manage and track all your cricket auctions</p>
            </div>
            
            <button onClick={handleCreateAuction} className="create-auction-btn">
              <Plus size={20} />
              <span>Create New Auction</span>
            </button>
          </div>
        </div>

        {auctions.length > 0 ? (
          <>
            {/* Search and Filter Section */}
            <div className="search-filter-section">
              <div className="search-container">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search auctions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-container">
                <Filter size={18} className="filter-icon" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Live</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Statistics Section */}
            <div className="stats-section">
              <div className="stat-card">
                <div className="stat-icon total">
                  <Target size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-number">{auctions.length}</span>
                  <span className="stat-label1">Total Auctions</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon upcoming">
                  <Clock size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-number">
                    {auctions.filter(a => a.status === 'upcoming').length}
                  </span>
                  <span className="stat-label1">Upcoming</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon revenue">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-number">
                    ₹{auctions.reduce((sum, auction) => sum + (auction.entryfees * auction.maxteams), 0).toLocaleString()}
                  </span>
                  <span className="stat-label1">Total Revenue</span>
                </div>
              </div>
            </div>

            {/* Auctions Grid */}
            <div className="auctions-grid">
              {filteredAuctions.map((auction) => (
                <div key={auction._id} className="auction-card">
                  <div className="auction-card-header">
                    <div className="auction-title-section">
                      <h3 className="auction-title">{auction.auctionname}</h3>
                      <span className="auction-id">#{auction.auctionid}</span>
                    </div>
                    {getStatusBadge(auction)}
                  </div>

                  <div className="auction-details">
                    <div className="detail-item">
                      <Calendar size={16} />
                      <span>{new Date(auction.auctiondate).toLocaleDateString()} at {auction.auctiontime}</span>
                    </div>
                    
                    <div className="detail-item">
                      <MapPin size={16} />
                      <span>{auction.place}</span>
                    </div>
                    
                    <div className="detail-item">
                      <Users size={16} />
                      <span>{auction.maxteams} Teams • {auction.maxplayersperteam} Players/Team</span>
                    </div>
                    
                    <div className="detail-item">
                      <IndianRupee size={16} />
                      <span>Budget: ₹{auction.budgetperteam} Lakhs • Entry: ₹{auction.entryfees}</span>
                    </div>
                    
                    {auction.rewardprize > 0 && (
                      <div className="detail-item">
                        <Trophy size={16} />
                        <span>Prize Pool: ₹{auction.rewardprize.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="auction-card-footer">
                    <div className="teams-info">
                      <span className="teams-count">
                        {auction.teams ? auction.teams.length : 0} / {auction.maxteams} Teams Joined
                      </span>
                      <div className="view-buttons">
                        <button
                          onClick={() => handleViewTeams(auction)}
                          className="view-teams-btn"
                        >
                          <Eye size={14} />
                          View Teams
                        </button>

                        <button
                          onClick={() => handleViewRequests(auction)}
                          className="view-teams-btn"
                        >
                          <FileText size={14} />
                          View Requests
                        </button>
                      </div>
                    </div>
                    
                    <div className="action-buttons">
                      {auction.status === 'upcoming' && (
                        <button
                          onClick={() => handleStatusUpdate(auction._id, 'ongoing')}
                          className="action-btn start"
                          title="Start Auction"
                        >
                          <Play size={16} />
                        </button>
                      )}
                      
                      {auction.status === 'ongoing' && (
                        <>
                          <div className="status-notice live-notice">
                            <AlertCircle size={16} />
                            <span>Live</span>
                          </div>
                          <button
                            onClick={() => navigate(`/live/${auction.auctionid}`)}
                            className="action-btn enter"
                            title="Enter Auction"
                          >
                            Enter Auction
                          </button>
                        </>
                      )}
                      
                      {auction.status === 'completed' && (
                        <div className="status-notice completed-notice">
                          <Trophy size={16} />
                          <span>Completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredAuctions.length === 0 && (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No auctions found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <div className="cricket-icon">🏏</div>
            </div>
            <h2>No Auctions Created Yet</h2>
            <p>Start organizing your cricket auction by creating your first auction event</p>
            
            <button onClick={handleCreateAuction} className="empty-create-btn">
              <Plus size={20} />
              <span>Create Your First Auction</span>
            </button>
          </div>
        )}
      </div>

      {showTeamsModal && selectedAuction && (
  <div className="modal-overlay" onClick={closeTeamsModal}>
    <div className="teams-modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <div className="modal-title-section">
          <h2>Teams in {selectedAuction.auctionname}</h2>
          <p>Auction ID: #{selectedAuction.auctionid}</p>
        </div>
        <button onClick={closeTeamsModal} className="close-btn">
          <X size={24} />
        </button>
      </div>
      
      <div className="modal-content">
        {selectedAuction.teams && selectedAuction.teams.length > 0 ? (
          <div className="teams-grid">
            {selectedAuction.teams.map((team, index) => (
              <div key={index} className="team-card">
                <div className="team-header">
                  <div className="team-avatar">
                    {team.teamlogo && team.teamlogo.data ? (
                      <img 
                        src={`data:${team.teamlogo.contentType};base64,${btoa(
                          new Uint8Array(team.teamlogo.data.data).reduce(
                            (data, byte) => data + String.fromCharCode(byte), ''
                          )
                        )}`}
                        alt="Team Logo"
                        className="team-logo-img"
                      />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div className="team-info">
                    <h4 className="team-name1">{team.teamname || 'Unnamed Team'}</h4>
                    <p className="team-phone">Phone: {team.phonenumber || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="team-details">
                  <div className="team-detail">
                    <span className="label">Auction:</span>
                    <span className="value">{selectedAuction.auctionname}</span>
                  </div>
                  <div className="team-detail">
                    <span className="label">Status:</span>
                    <span className="value">Approved</span>
                  </div>
                  {team.joinedAt && (
                    <div className="team-detail">
                      <span className="label">Joined:</span>
                      <span className="value">
                        {new Date(team.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-teams">
            <div className="no-teams-icon">👥</div>
            <h3>No Teams Joined Yet</h3>
            <p>Teams will appear here once they join your auction</p>
          </div>
        )}
      </div>
      
      <div className="modal-footer">
        <div className="teams-summary">
          <span>
            {selectedAuction.teams ? selectedAuction.teams.length : 0} of {selectedAuction.maxteams} teams joined
          </span>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Requests Modal */}
      {showRequestsModal && selectedAuction && (
          <div className="modal-overlay" onClick={closeRequestsModal}>
            <div className="teams-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title-section">
                  <h2>Join Requests</h2>
                  <p>{selectedAuction.auctionname}</p>
                </div>
                <button onClick={closeRequestsModal} className="close-btn">
                  <X size={24} />
                </button>
              </div>
              
              <div className="modal-content">
                {requestsLoading ? (
                  <div className="loading-requests">
                    <div className="loading-spinner">
                      <div ></div>
                    </div>
                    <p>Loading requests...</p>
                  </div>
                ) : requests.length > 0 ? (
                  <div className="requests-grid">
                    {requests.map((request) => (
                      <div key={request._id} className="request-card">
                        <div className="request-header">
                          <div className="team-logo">
                            {request.teamlogo && request.teamlogo.data ? (
                              <img
                                src={`data:${request.teamlogo.contentType};base64,${btoa(
                                  new Uint8Array(request.teamlogo.data.data).reduce(
                                    (data, byte) => data + String.fromCharCode(byte), ''
                                  )
                                )}`}
                                alt="Team Logo"
                                className="logo-img"
                              />
                            ) : (
                              <User size={24} />
                            )}
                          </div>
                          <div className="request-info">
                            <h4 className="team-name1">{request.teamname}</h4>
                            <p className="team-owner">Phone: {request.phonenumber}</p>
                            <p className="team-status">
                              Status: <span className={`status-badge ${request.teamstatus}`}>{request.teamstatus}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="request-details">
                          <div className="request-detail">
                            <span className="label">Requested:</span>
                            <span className="value">
                              {request.requestedAt ? new Date(request.requestedAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <div className="request-detail">
                            <span className="label">Auction Name:</span>
                            <span className="value">{selectedAuction.auctionname}</span>

                            </div>
                        </div>

                        <div className="request-actions">
                          {request.screenshot && request.screenshot.data && (
                            <button
                              onClick={() => {
                                // Convert binary to base64 for image preview
                                const base64 = btoa(
                                  new Uint8Array(request.screenshot.data.data).reduce(
                                    (data, byte) => data + String.fromCharCode(byte), ''
                                  )
                                );
                                handleViewScreenshot(`data:${request.screenshot.contentType};base64,${base64}`);
                              }}
                              className="screenshot-btn"
                              title="View Payment Screenshot"
                            >
                              <Image size={16} />
                              View Screenshot
                            </button>
                          )}
                          
                          <div className="action-buttons-group">
                            <button
                              onClick={() => handleApproveRequest(request._id, selectedAuction.auctionid)}
                              className="approve-btn"
                              title="Approve Request"
                            >
                              <Check size={16} />
                              Approve
                            </button>
                            
                            <button
                              onClick={() => handleRejectRequest(request._id)}
                              className="reject-btn"
                              title="Reject Request"
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-teams">
                    <div className="no-teams-icon">📝</div>
                    <h3>No Pending Requests</h3>
                    <p>Team join requests will appear here when submitted</p>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <div className="requests-summary">
                  <span>{requests.length} pending request{requests.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Screenshot Modal */}
        {screenshotModal.show && (
          <div className="modal-overlay" onClick={closeScreenshotModal}>
            <div className="screenshot-modal" onClick={(e) => e.stopPropagation()}>
              <div className="screenshot-header">
                <h3>Payment Screenshot</h3>
                <button onClick={closeScreenshotModal} className="close-btn">
                  <X size={24} />
                </button>
              </div>
              <div className="screenshot-content">
                <img 
                  src={screenshotModal.url} 
                  alt="Payment Screenshot" 
                  className="screenshot-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="screenshot-error" style={{ display: 'none' }}>
                  <p>Unable to load screenshot</p>
                  <a 
                    href={screenshotModal.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="external-link"
                  >
                    <ExternalLink size={16} />
                    Open in new tab
                  </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default MyAuctions;
