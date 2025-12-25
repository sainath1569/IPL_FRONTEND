import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import { Play, Users, Clock, Trophy, MapPin, Calendar, IndianRupee, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import '../styles/joinedauctions.css';
import Swal from 'sweetalert2';

const JoinedAuctions = () => {
  const navigate = useNavigate();
  const toastHook = useToast();
  const [joinedAuctions, setJoinedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const showToast = (options) => {
    if (toastHook?.toast) {
      toastHook.toast(options);
    } else {
      alert(`${options.title}: ${options.description}`);
    }
  };

  useEffect(() => {
    const userEmail = localStorage.getItem('email');
    if (!userEmail) {
      showToast({
        title: "Authentication Required",
        description: "Please login to view your joined auctions",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    fetchJoinedAuctions(userEmail);
  }, [navigate]);

  const fetchJoinedAuctions = async (userEmail) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`https://ipl-server-dsy3.onrender.com/api/auction/joined?email=${encodeURIComponent(userEmail)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch joined auctions');
      }

      const data = await response.json();
      setJoinedAuctions(data);
    } catch (err) {
      setError(err.message);
      showToast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAuctionStatus = (auction) => {
    const now = new Date();
    const auctionDate = new Date(auction.auctiondate);
    const auctionTime = auction.auctiontime.split(':');
    const auctionDateTime = new Date(
      auctionDate.getFullYear(),
      auctionDate.getMonth(),
      auctionDate.getDate(),
      parseInt(auctionTime[0]),
      parseInt(auctionTime[1])
    );

    if (auction.status === 'completed') {
      return { status: 'completed', label: 'Completed', class: 'completed' };
    } else if (auction.status === 'ongoing' ) {
      return { status: 'live', label: 'Live', class: 'live' };
    } else {
      return { status: 'upcoming', label: 'Upcoming', class: 'upcoming' };
    }
  };

  const handleViewAuction = (auction) => {
    const status = getAuctionStatus(auction);
    
    switch (status.status) {
      case 'live':
        navigate(`/live/${auction.auctionid}`);
        break;
      case 'upcoming':
        Swal.fire({
          title: auction.auctionname,
          html: `
            <div class="swal-auction-details">
              <p><strong>Your Team:</strong> ${auction.userTeam?.teamname || 'N/A'}</p>
              <p><strong>Date:</strong> ${new Date(auction.auctiondate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${auction.auctiontime}</p>
              <p><strong>Location:</strong> ${auction.place}</p>
              <div class="swal-note">
                <p>You're all set for this auction!</p>
                <p>Please join on time.</p>
              </div>
            </div>
          `,
          confirmButtonText: 'OK',
          width: 500
        });
        break;
      case 'completed':
        navigate(`/auction/${auction.auctionid}/results`);
        break;
    }
  };

  if (loading) {
    return (
      <div className="ongoing-auctions-page">
        <div className="loading-container0">
          <div className="loading-spinner0"></div>
          <h3>Loading Your Joined Auctions...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (

      <div className="ongoing-auctions-page">
        <div className="error-container">
          <h3>Error Loading Auctions</h3>
          <p>{error}</p>
          <button onClick={() => fetchJoinedAuctions(localStorage.getItem('email'))}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
            <Navbar />

    <div className="ongoing-auctions-page">
\      <div className="auctions-container">
        <div className="page-header">
          <h1>My Joined Auctions</h1>
          <p>View your registered cricket auctions</p>
        </div>

        {joinedAuctions.length > 0 ? (
          <div className="auctions-grid">
            {joinedAuctions.map(auction => {
              const status = getAuctionStatus(auction);
              return (
                <div key={auction._id} className="auction-card">
                  <div className="auction-header">
                    <h3>{auction.auctionname}</h3>
                    <span className={`status-badge ${status.class}`}>
                      {status.label}
                    </span>
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
                      <span>Your Team: {auction.userTeam?.teamname || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="auction-footer">
                    <button 
                      onClick={() => handleViewAuction(auction)}
                      className={`action-btn ${status.class}`}
                    >
                      {status.status === 'live' ? 'Join Live' : 
                       status.status === 'upcoming' ? 'View Details' : 'View Results'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🏏</div>
            <h3>No Joined Auctions</h3>
            <p>You haven't joined any auctions yet</p>
            <button onClick={() => navigate('/upcoming-auctions')}>
              Browse Upcoming Auctions
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default JoinedAuctions;