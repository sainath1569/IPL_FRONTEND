import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, X, Check, ChevronDown, IndianRupee, Filter, 
  Search, ShieldAlert, ArrowLeft, Users, Upload, FileText
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
  const [loading, setLoading] = useState({ 
    main: false, 
    players: false, 
    count: false,
    pdf: false 
  });
  const [error, setError] = useState('');
  const [pdfFile, setPdfFile] = useState(null);

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
        
        // Set all players as unselected by default with base price
        const playersWithSelection = data.map(p => ({ 
          ...p, 
          selected: false, // Default unselected
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

  // Parse PDF file using simple text extraction
  const parsePDF = async (file) => {
    try {
      setLoading(prev => ({ ...prev, pdf: true }));
      
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target.result;
            const bytes = new Uint8Array(arrayBuffer);
            let text = '';
            
            // Extract text from PDF bytes (simplified approach)
            // This works for text-based PDFs, not scanned PDFs
            for (let i = 0; i < bytes.length; i++) {
              // Look for text content (ASCII characters and spaces)
              if ((bytes[i] >= 32 && bytes[i] <= 126) || bytes[i] === 10 || bytes[i] === 13) {
                text += String.fromCharCode(bytes[i]);
              }
            }
            
            // Clean up the text
            text = text.replace(/\r/g, '\n').replace(/\n+/g, '\n').trim();
            
            // Parse the extracted text for players
            const playersFromPDF = [];
            
            // Split into lines
            const lines = text.split('\n').filter(line => line.trim());
            
            // Common name corrections for your specific PDF typos
            const nameCorrections = {
              'Vitat Kohli': 'Virat Kohli',
              'Sfreyas Iyer': 'Shreyas Iyer',
              'Ruturg Galiwad': 'Ruturaj Gaikwad',
              'Yashasri Jaiswal': 'Yashasvi Jaiswal',
              'Deedutt Padikkal': 'Devdutt Padikkal',
              'Prithini Shaw': 'Prithvi Shaw',
              'Sal Sudharsan': 'Sai Sudharsan',
              'Ambari Rayudu': 'Ambati Rayudu',
              'Martin Gupilli': 'Martin Guptill',
              'Nehal Wadhara': 'Nehal Wadhera',
              'Ayush Baldoni': 'Ayush Badoni',
              'Rababih Pant': 'Rishabh Pant',
              'Islam Kidhan': 'Ishan Kishan',
              'Riesh Sharma': 'Rishi Sharma',
              'Prabhaiman Singh': 'Prabhsimran Singh',
              'Dinuv Jurel': 'Dhruv Jurel',
              'Nicholas Poonan': 'Nicholas Pooran',
              'Ovity Devon Conway': 'Devon Conway',
              'Azer Patel': 'Axar Patel',
              'Mosen Ali': 'Moeen Ali',
              'Washington': 'Washington Sundar',
              'Sunday': 'Washington Sundar',
              'Ravichandran': 'Ravichandran Ashwin',
              'Ashwin': 'Ravichandran Ashwin',
              'Shaolul Thakur': 'Shardul Thakur',
              'Wanirolu Hasaranga': 'Wanindu Hasaranga',
              'Hasaranga': 'Wanindu Hasaranga',
              'Jasprit Bunmah': 'Jasprit Bumrah',
              'Mohammed': 'Mohammed Shami',
              'Shaeni': 'Mohammed Siraj',
              'Mohammed Singi': 'Mohammed Siraj',
              'Acindieep Singh': 'Arshdeep Singh',
              'Bhavneshwar Kumar': 'Bhuvneshwar Kumar',
              'Kumar': 'Bhuvneshwar Kumar',
              'Ravi Bhimoi': 'Ravi Bishnoi',
              'Varun': 'Varun Chakravarthy',
              'Chakravarthy': 'Varun Chakravarthy',
              'Amich Norrje': 'Anrich Nortje',
              'Ichi Haslewood': 'Josh Hazlewood',
              'Alzam Joseph': 'Alzarri Joseph',
              'Mujeeb Ur': 'Mujeeb Ur Rahman',
              'Raisman': 'Mujeeb Ur Rahman',
              'Maheesh': 'Maheesh Theekshana',
              'Theelohana': 'Maheesh Theekshana',
              'Prasdin Krishna': 'Prasidh Krishna',
              'Sihant Sharma': 'Ishant Sharma',
              'Faf du Plessis': 'Faf du Plessis',
              'Glenn Phillips': 'Glenn Phillips',
              'Tim David': 'Tim David',
              'Devon Conway': 'Devon Conway',
              'Rashe van der Dussen': 'Rassie van der Dussen',
              'Alex Hales': 'Alex Hales',
              'Jason Roy': 'Jason Roy',
              'Quinton de Kock': 'Quinton de Kock',
              'Heinrich Klassen': 'Heinrich Klaasen',
              'Phil Salt': 'Phil Salt',
              'KS Bharat': 'KS Bharat',
              'Matthew Wade': 'Matthew Wade',
              'Ryan Rickelton': 'Ryan Rickelton',
              'Jonny Bairstow': 'Jonny Bairstow',
              'Tim Seifert': 'Tim Seifert',
              'Hardik Pandya': 'Hardik Pandya',
              'Ravindra Jadeja': 'Ravindra Jadeja',
              'Glenn Maxwell': 'Glenn Maxwell',
              'Marcus Storins': 'Marcus Stoinis',
              'Cameron Green': 'Cameron Green',
              'Sam Curran': 'Sam Curran',
              'Ben Stokes': 'Ben Stokes',
              'Shivam Dube': 'Shivam Dube',
              'Sunil Narine': 'Sunil Narine',
              'Andre Russell': 'Andre Russell',
              'Mitchell Marsh': 'Mitchell Marsh',
              'Jason Holder': 'Jason Holder',
              'Kunal Pandya': 'Krunal Pandya',
              'Deepak Hooda': 'Deepak Hooda',
              'Venkatesh Iyer': 'Venkatesh Iyer',
              'Shabbaz Ahmed': 'Shahbaz Ahmed',
              'Vijay Shankar': 'Vijay Shankar',
              'Sikandar Raza': 'Sikandar Raza',
              'Marco Jansen': 'Marco Jansen',
              'Romano Shepherd': 'Romario Shepherd',
              'Daniel Sams': 'Daniel Sams',
              'Abhishek Sharma': 'Abhishek Sharma',
              'Riyan Parag': 'Riyan Parag',
              'Lalit Yadav': 'Lalit Yadav',
              'Yuzvendra Chahal': 'Yuzvendra Chahal',
              'Kubileep Yadav': 'Kuldeep Yadav',
              'Rahul Chahar': 'Rahul Chahar',
              'Pat Cummins': 'Pat Cummins',
              'Trent Boult': 'Trent Boult',
              'Kagiso Rabada': 'Kagiso Rabada',
              'Mark Wood': 'Mark Wood',
              'Lockie Ferguson': 'Lockie Ferguson',
              'Lungi Ngidi': 'Lungi Ngidi',
              'Gerald Coetzee': 'Gerald Coetzee',
              'Rashid Khan': 'Rashid Khan',
              'Adam Zampa': 'Adam Zampa',
              'Noor Ahmad': 'Noor Ahmad',
              'Deepak Chahar': 'Deepak Chahar',
              'T Natarajan': 'T Natarajan',
              'Avesh Khan': 'Avesh Khan',
              'Mukesh Kumar': 'Mukesh Kumar',
              'Piyush Chawla': 'Piyush Chawla',
              'Amit Mishra': 'Amit Mishra',
              'R Sai Kishore': 'R Sai Kishore',
              'Harshit Rana': 'Harshit Rana'
            };
            
            // Process each line
            lines.forEach(line => {
              line = line.trim();
              
              // Skip headers, page numbers, etc.
              if (line.length < 2 || 
                  line.includes('=====') || 
                  line.includes('Page') ||
                  line.includes('Player Name') || 
                  line.includes('Base Price') ||
                  line.includes('Lakhs') ||
                  line === '---' ||
                  line === '|' ||
                  line === '(VK)' ||
                  line.startsWith('=')) {
                return;
              }
              
              // Clean the line
              line = line.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
              
              // Try to find a number (price) in the line
              const priceMatch = line.match(/\b(\d{1,3})\b/);
              if (priceMatch) {
                const basePrice = parseInt(priceMatch[1], 10);
                let playerName = '';
                
                // Extract player name by removing the price and any special characters
                if (priceMatch.index > 0) {
                  playerName = line.substring(0, priceMatch.index).trim();
                } else {
                  // If price is at the start, take everything after it
                  playerName = line.substring(priceMatch[0].length).trim();
                }
                
                // Clean player name
                playerName = playerName.replace(/[^\w\s\.\-']/g, ' ').replace(/\s+/g, ' ').trim();
                
                // Apply name corrections
                if (nameCorrections[playerName]) {
                  playerName = nameCorrections[playerName];
                }
                
                // Skip if name is too short or price is invalid
                if (playerName.length >= 2 && basePrice > 0 && basePrice <= 1000) {
                  playersFromPDF.push({
                    name: playerName,
                    basePrice: basePrice
                  });
                }
              }
            });
            
            // Remove duplicates
            const uniquePlayers = [];
            const seenNames = new Set();
            
            playersFromPDF.forEach(player => {
              const normalizedName = player.name.toLowerCase().replace(/\s+/g, ' ');
              if (!seenNames.has(normalizedName)) {
                seenNames.add(normalizedName);
                uniquePlayers.push(player);
              }
            });
            
            console.log(`Parsed ${uniquePlayers.length} unique players from PDF`);
            resolve(uniquePlayers);
            
          } catch (err) {
            console.error('Error parsing PDF:', err);
            reject(new Error('Failed to parse PDF. Please ensure it contains text.'));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read PDF file'));
        };
        
        reader.readAsArrayBuffer(file);
      });
      
    } catch (err) {
      console.error('Error parsing PDF:', err);
      throw new Error('Failed to parse PDF file.');
    } finally {
      setLoading(prev => ({ ...prev, pdf: false }));
    }
  };

  // Handle PDF upload and process
  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please upload a PDF file',
      });
      return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Please upload a PDF smaller than 5MB',
      });
      return;
    }
    
    setPdfFile(file);
    
    try {
      // Show loading
      Swal.fire({
        title: 'Processing PDF...',
        html: 'Reading PDF file...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      // Parse PDF
      const playersFromPDF = await parsePDF(file);
      
      Swal.close();
      
      if (playersFromPDF.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Players Found',
          text: 'Could not extract player data from PDF. Please ensure it contains player names and base prices.',
        });
        return;
      }
      
      // Check if players are loaded
      if (selectedPlayers.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Load Players First',
          text: 'Please open the player selector to load players from database first.',
          confirmButtonText: 'Open Selector',
          showCancelButton: true
        }).then((result) => {
          if (result.isConfirmed) {
            setShowPlayerSelector(true);
          }
        });
        return;
      }
      
      // Process PDF players
      processPDFPlayers(playersFromPDF);
      
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Processing Error',
        text: err.message || 'Failed to process PDF file',
      });
    }
  };

  // Process players from PDF and select matching players
  const processPDFPlayers = (playersFromPDF) => {
    const updatedPlayers = [...selectedPlayers];
    const selectedNames = [];
    const skippedNames = [];
    
    // For each player from PDF, try to find and select matching player
    playersFromPDF.forEach(pdfPlayer => {
      // Try to find exact match first (case insensitive)
      let foundPlayer = updatedPlayers.find(
        p => p.name.toLowerCase() === pdfPlayer.name.toLowerCase()
      );
      
      // If not found, try fuzzy matching
      if (!foundPlayer) {
        foundPlayer = updatedPlayers.find(p => {
          const playerName = p.name.toLowerCase();
          const pdfName = pdfPlayer.name.toLowerCase();
          
          // Split names into words
          const playerWords = playerName.split(/\s+/);
          const pdfWords = pdfName.split(/\s+/);
          
          // Check if any word matches (fuzzy)
          for (const playerWord of playerWords) {
            for (const pdfWord of pdfWords) {
              if (playerWord.length > 2 && pdfWord.length > 2) {
                if (playerWord.includes(pdfWord) || pdfWord.includes(playerWord)) {
                  return true;
                }
              }
            }
          }
          
          // Check if names are similar
          return playerName.includes(pdfName) || 
                 pdfName.includes(playerName) ||
                 playerName.replace(/\s/g, '').includes(pdfName.replace(/\s/g, '')) ||
                 pdfName.replace(/\s/g, '').includes(playerName.replace(/\s/g, ''));
        });
      }
      
      if (foundPlayer) {
        // Select player and set base price
        const playerIndex = updatedPlayers.findIndex(p => p._id === foundPlayer._id);
        if (playerIndex !== -1) {
          updatedPlayers[playerIndex] = {
            ...updatedPlayers[playerIndex],
            selected: true,
            base: pdfPlayer.basePrice
          };
          
          selectedNames.push({
            name: foundPlayer.name,
            basePrice: pdfPlayer.basePrice,
            originalPdfName: pdfPlayer.name,
            status: 'Selected'
          });
        }
      } else {
        skippedNames.push({
          name: pdfPlayer.name,
          basePrice: pdfPlayer.basePrice,
          reason: 'Not found in database'
        });
      }
    });
    
    setSelectedPlayers(updatedPlayers);
    
    // Prepare summary HTML
    let summaryHTML = `
      <div style="text-align: left; max-height: 500px; overflow-y: auto; padding: 5px;">
        <h4 style="margin-bottom: 15px; color: #333;">PDF Processing Complete</h4>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 5px 0;"><strong>Total entries in PDF:</strong> ${playersFromPDF.length}</p>
          <p style="margin: 5px 0; color: #28a745;"><strong>Successfully processed:</strong> ${selectedNames.length} players</p>
          <p style="margin: 5px 0; color: #dc3545;"><strong>Skipped (not found):</strong> ${skippedNames.length} players</p>
        </div>
    `;
    
    if (selectedNames.length > 0) {
      summaryHTML += `
        <div style="margin-top: 15px;">
          <h5 style="margin-bottom: 10px; color: #495057;">Processed Players:</h5>
          <div style="max-height: 200px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 6px;">
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
              <thead>
                <tr style="background: #e9ecef;">
                  <th style="text-align: left; padding: 10px; border-bottom: 2px solid #dee2e6;">Player</th>
                  <th style="text-align: left; padding: 10px; border-bottom: 2px solid #dee2e6;">Base Price</th>
                  <th style="text-align: left; padding: 10px; border-bottom: 2px solid #dee2e6;">Status</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      selectedNames.forEach((player, index) => {
        if (index < 20) {
          const rowColor = index % 2 === 0 ? '#fff' : '#f8f9fa';
          summaryHTML += `
            <tr style="background: ${rowColor};">
              <td style="padding: 8px 10px; border-bottom: 1px solid #dee2e6;">${player.name}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #dee2e6;"><strong>₹ ${player.basePrice} L</strong></td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #dee2e6; color: #28a745;">${player.status}</td>
            </tr>
          `;
        }
      });
      
      if (selectedNames.length > 20) {
        summaryHTML += `
          <tr>
            <td colspan="3" style="padding: 10px; text-align: center; font-style: italic; background: #f8f9fa;">
              ... and ${selectedNames.length - 20} more players
            </td>
          </tr>
        `;
      }
      
      summaryHTML += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
    
    if (skippedNames.length > 0) {
      summaryHTML += `
        <div style="margin-top: 15px;">
          <h5 style="margin-bottom: 10px; color: #856404;">Skipped Players (not found in database):</h5>
          <div style="max-height: 150px; overflow-y: auto; padding: 12px; background: #fff3cd; border-radius: 6px; border: 1px solid #ffeaa7;">
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
      `;
      
      skippedNames.forEach((player, index) => {
        if (index < 10) {
          summaryHTML += `<li style="margin-bottom: 4px;">${player.name} <span style="color: #666;">(₹ ${player.basePrice} L)</span></li>`;
        }
      });
      
      if (skippedNames.length > 10) {
        summaryHTML += `<li style="font-style: italic; color: #666;">... and ${skippedNames.length - 10} more</li>`;
      }
      
      summaryHTML += `
            </ul>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #856404;">
              <strong>Note:</strong> These players were in the PDF but not found in your player database.
            </p>
          </div>
        </div>
      `;
    }
    
    summaryHTML += `
        <div style="margin-top: 15px; padding: 12px; background: #e7f3ff; border-radius: 6px; border: 1px solid #b3d7ff;">
          <p style="margin: 0; font-size: 12px; color: #0066cc;">
            <strong>✅ Success!</strong> ${selectedNames.length} players were automatically selected and their base prices were set from the PDF.
            You can review and adjust selections in the player selector below.
          </p>
        </div>
      </div>
    `;
    
    // Show summary
    Swal.fire({
      icon: 'success',
      title: 'PDF Import Successful!',
      html: summaryHTML,
      confirmButtonText: 'Continue',
      width: '700px',
      showCloseButton: true,
      customClass: {
        popup: 'pdf-summary-popup'
      }
    });
  };

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

      // Success
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
              {/* Form fields */}
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
                {/* PDF Upload Button */}
                <div className="pdf-upload-container">
                  <label className="pdf-upload-btn">
                    <Upload size={18} />
                    Upload Player List (PDF)
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span className="pdf-upload-hint">
                    Upload PDF with player names and base prices
                  </span>
                </div>
                
                <button
                  type="button"
                  className="option-btn secondary"
                  onClick={() => setShowPlayerSelector(!showPlayerSelector)}
                >
                  {showPlayerSelector ? <X size={18} /> : <ChevronDown size={18} />}
                  {showPlayerSelector ? 'Close Selector' : 'Select/Edit Players'}
                </button>
              </div>
              
              {/* PDF Upload Info */}
              {pdfFile && (
                <div className="pdf-info">
                  <FileText size={16} />
                  <span>{pdfFile.name}</span>
                  {loading.pdf && (
                    <span className="pdf-processing">Processing...</span>
                  )}
                </div>
              )}
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