import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import { Play, Users, Clock, Trophy, MapPin, Calendar, IndianRupee, X, Upload } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import '../styles/upcomingauctions.css';
import Swal from 'sweetalert2';

const OngoingAuctions = () => {
  const navigate = useNavigate();
  const toastHook = useToast();
  
  const showToast = (options) => {
    if (typeof toastHook === 'function') {
      toastHook(options);
    } else if (toastHook && typeof toastHook.toast === 'function') {
      toastHook.toast(options);
    } else if (toastHook && typeof toastHook.success === 'function') {
      if (options.variant === 'destructive') {
        toastHook.error(options.description || options.title);
      } else {
        toastHook.success(options.description || options.title);
      }
    } else {
      alert(`${options.title}: ${options.description}`);
    }
  };

  const [upcomingAuctions, setUpcomingAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [teamData, setTeamData] = useState({
    teamname: '',
    phonenumber: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUpcomingAuctions();
  }, []);

  const fetchUpcomingAuctions = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://ipl-server-lake.vercel.app/api/auction/upcoming', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUpcomingAuctions(data);
      } else {
        console.error('Failed to fetch upcoming auctions');
        setUpcomingAuctions([]);
      }
    } catch (error) {
      console.error('Error fetching upcoming auctions:', error);
      setUpcomingAuctions([]);
    } finally {
      setLoading(false);
    }
  };

   const handleJoinAuction = (auction) => {
    const userEmail = localStorage.getItem('email');
    if (!userEmail) {
      showToast({
        title: "Authentication Required",
        description: "Please login to join an auction",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    // Check if user is the creator of the auction
    if (auction.createdby === userEmail) {
      return;
    }

    // Check if user already has a team in this auction
    const userTeam = auction.teams?.find(team => team.email === userEmail);
    if (userTeam) {
      handleTeamStatusClick(auction, userTeam.status);
      return;
    }

    setSelectedAuction(auction);
    setShowJoinModal(true);
  };

  const handleTeamStatusClick = (auction, status) => {
    switch (status) {
      case 'pending':
        Swal.fire({
          title: 'Request Pending',
          html: `Your request is being processed by the auction admin.<br>Kindly wait for a while.<br><br>For queries contact: <strong>${auction.phonenumber || 'Not provided'}</strong>`,
          icon: 'info',
          confirmButtonText: 'OK'
        });
        break;
      case 'approved':
        Swal.fire({
          title: 'Request Approved!',
          html: `Your request was approved, now you are in the auction.<br><br>The auction will start on <strong>${new Date(auction.auctiondate).toLocaleDateString()} at ${auction.auctiontime}</strong>.<br><br>Kindly be on time for the auction.`,
          icon: 'success',
          confirmButtonText: 'OK'
        });
        break;
      case 'rejected':
        Swal.fire({
          title: 'Request Rejected',
          html: `Sorry to say, your request was rejected.<br>This might be due to payment issues or maximum teams reached.<br><br>For queries contact: <strong>${auction.contactnumber || 'Not provided'}</strong>`,
          icon: 'error',
          confirmButtonText: 'OK'
        });
        break;
      default:
        break;
    }
  };

  const renderJoinButton = (auction) => {
  const userEmail = localStorage.getItem('email');
  
  // 1. Check if user is the creator
  if (auction.createdby === userEmail) {
    return <button className="creator-btn" disabled>Created by you</button>;
  }

  // 2. Check if user has an approved team (in auction.teams)
  const approvedTeam = auction.teams?.find(team => team.email === userEmail);
  if (approvedTeam) {
    return (
      <button className="status-btn approved" disabled>
        Team Approved
      </button>
    );
  }

  // 3. Check if user has a pending request (in auction.requests)
  const userRequest = auction.requests?.find(req => req.email === userEmail);
  if (userRequest) {
    let buttonClass = 'status-btn ';
    let buttonText = '';
    
    switch (userRequest.teamstatus) {
      case 'pending':
        buttonClass += 'pending';
        buttonText = 'Pending Approval';
        break;
      case 'rejected':
        buttonClass += 'rejected';
        buttonText = 'Request Rejected';
        break;
      case 'approved':
        buttonClass += 'approved';
        buttonText = 'Request Approved';
        break;
      default:
        buttonClass += 'unknown';
        buttonText = 'Unknown Status';

      
    }

    return (
      <button 
        className={buttonClass}
        onClick={() => handleTeamStatusClick(auction, userRequest.teamstatus)}
      >
        {buttonText}
      </button>
    );
  }

  // 4. Default case - show join button if slots available
  return (
    <button 
      onClick={() => handleJoinAuction(auction)}
      className="join-btn"
      disabled={auction.teams?.length >= auction.maxteams}
    >
      <Trophy size={16} />
      <span>Join Auction</span>
    </button>
  );
};
  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast({
          title: "File too large",
          description: "Please select an image smaller than 2MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setTeamData(prev => ({ ...prev, teamlogo: e.target.result }));
      };
      reader.readAsDataURL(file);
      setLogoFile(file);
    }
  };

  const handleScreenshotUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast({
          title: "File too large",
          description: "Please select an image smaller than 2MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setTeamData(prev => ({ ...prev, paymentscreenshot: e.target.result }));
      };
      reader.readAsDataURL(file);
      setScreenshotFile(file);
    }
  };

  const handleSubmitJoinRequest = async () => {
    if (!teamData.teamname.trim() || !teamData.phonenumber.trim() || !screenshotFile) {
      showToast({
        title: "Missing Information",
        description: "Please fill in all required fields including payment screenshot",
        variant: "destructive"
      });
      return;
    }

    if (teamData.phonenumber.length !== 10) {
      showToast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('teamname', teamData.teamname);
      formData.append('phonenumber', teamData.phonenumber);
      formData.append('email', localStorage.getItem('email'));
      formData.append('auctionid', selectedAuction.auctionid);
      formData.append('screenshot', screenshotFile);
      
      if (logoFile) {
        formData.append('teamlogo', logoFile);
      }

      const response = await fetch('https://ipl-server-lake.vercel.app/api/auction/join', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit team');
      }

      showToast({
        title: "Success!",
        description: "Your team has been submitted for approval",
        variant: "default"
      });

      setShowJoinModal(false);
      setTeamData({ 
        teamname: '', 
        phonenumber: '',
      });
      setLogoFile(null);
      setScreenshotFile(null);

    } catch (error) {
      console.error('Team submission error:', error);
      showToast({
        title: "Submission Failed",
        description: error.message || "Could not submit team",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowJoinModal(false);
    setSelectedAuction(null);
    setTeamData({ 
      teamname: '', 
      phonenumber: '',
    });
    setLogoFile(null);
    setScreenshotFile(null);
  };

  if (loading) {
    return (
      <div className="ongoing-auctions-page">
        <div className="loading-container4">
          <div className="loading-spinner2">
          </div>
          <h3>Loading Upcoming Auctions...</h3>
        </div>
      </div>
    );
  }

  return (
    <div>
            <Navbar />

    <div className="ongoing-auctions-page">
      <div className="auctions-container">
        <div className="page-header">
          <h1 className="page-title">Upcoming Auctions</h1>
          <p className="page-subtitle">Join exciting cricket auctions and build your dream team</p>
        </div>

        {upcomingAuctions.length > 0 ? (
          <div className="auctions-grid">
            {upcomingAuctions.map((auction) => (
              <div key={auction._id} className="auction-card">
                <div className="auction-header">
                  <div className="auction-title-section">
                    <h3 className="auction-title">{auction.auctionname}</h3>
                    <span className="auction-id">#{auction.auctionid}</span>
                  </div>
                  <div className="status-badge upcoming">
                    <Play size={14} />
                    <span>Upcoming</span>
                  </div>
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
                    <span>Budget: ₹{auction.budgetperteam} Cr • Entry: ₹{auction.entryfees}</span>
                  </div>
                  
                  {auction.rewardprize > 0 && (
                    <div className="detail-item">
                      <Trophy size={16} />
                      <span>Prize Pool: ₹{auction.rewardprize.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="auction-footer">
                  <div className="team-count">
                    <span>
                      {(auction.teams && Array.isArray(auction.teams) 
                        ? auction.teams.length 
                        : 0) || 0}/{auction.maxteams} Teams Joined
                    </span>
                  </div>
                  
                  {renderJoinButton(auction)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🏏</div>
            <h2>No Upcoming Auctions</h2>
            <p>There are currently no upcoming auctions available to join. Check back later!</p>
          </div>
        )}

        {showJoinModal && selectedAuction && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Join {selectedAuction.auctionname}</h3>
                <button onClick={closeModal} className="close-btn">
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group1">
                  <label htmlFor="teamname">Team Name *</label>
                  <input
                    type="text"
                    id="teamname"
                    value={teamData.teamname}
                    onChange={(e) => setTeamData(prev => ({ ...prev, teamname: e.target.value }))}
                    placeholder="Enter your team name"
                    className="form-input"
                    maxLength={30}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phonenumber">Phone Number *</label>
                  <input
                    type="tel"
                    id="phonenumber"
                    value={teamData.phonenumber}
                    onChange={(e) => setTeamData(prev => ({ ...prev, phonenumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="Enter 10-digit phone number"
                    className="form-input"
                    maxLength={10}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="teamlogo">Team Logo (Optional)</label>
                  <div className="logo-upload-container">
                    <input
                      type="file"
                      id="teamlogo"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="file-input"
                    />
                    {teamData.teamlogo && (
                      <div className="logo-preview">
                        <img src={teamData.teamlogo} alt="Team Logo Preview" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="entry-fees-section">
                  <h4>Entry Fees: ₹{selectedAuction.entryfees}</h4>
                  {selectedAuction.scannerimage && selectedAuction.scannerimage.data && (
                    <div className="qr-section">
                      <p>Scan the QR code below to pay the entry fees:</p>
                      <div className="qr-code">
                        <img
                          src={`data:${selectedAuction.scannerimage.contentType};base64,${Array.isArray(selectedAuction.scannerimage.data.data)
                            ? btoa(String.fromCharCode(...selectedAuction.scannerimage.data.data))
                            : selectedAuction.scannerimage.data
                          }`}
                          alt="Payment QR Code"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="paymentScreenshot">Payment Screenshot *</label>
                  <div className="file-upload-container">
                    <input
                      type="file"
                      id="paymentScreenshot"
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      className="hidden-file-input"
                      required
                    />
                    {teamData.paymentscreenshot && (
                      <div className="screenshot-preview">
                        <img src={teamData.paymentscreenshot} alt="Payment Screenshot Preview" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={closeModal} className="cancel-btn">
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitJoinRequest}
                  className="submit-btn"
                  disabled={submitting || !teamData.teamname.trim() || !teamData.phonenumber.trim() || !screenshotFile}
                >
                  {submitting ? 'Sending Request...' : 'Send Join Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default OngoingAuctions;