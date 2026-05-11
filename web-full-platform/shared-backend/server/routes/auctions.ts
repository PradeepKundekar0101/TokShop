import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();
const BASE_URL = process.env.BASE_URL || 'https://api.tokshoplive.com';

// GET /auction/:id - Fetch full auction details with bids
router.get('/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const auctionId = req.params.id;
    
    console.log('Fetching auction details for:', auctionId);

    const response = await fetch(`${BASE_URL}/auction/${auctionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('External API auction fetch error:', data);
      return res.status(response.status).json(data);
    }

    console.log('Auction details fetched successfully');
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching auction:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch auction' });
  }
});

// POST /auction/bid - Place a bid on an auction (new endpoint)
router.post('/bid', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { auctionId, amount, userId } = req.body;
    
    if (!auctionId || !amount || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: auctionId, amount, and userId are required' 
      });
    }

    console.log('Placing bid:', { user: userId, auction: auctionId, amount });

    // Transform to match external API structure
    const bidData = {
      user: userId,
      auction: auctionId,
      amount: amount,
    };

    const response = await fetch(`${BASE_URL}/auction/bid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bidData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('External API bid error:', data);
      return res.status(response.status).json(data);
    }

    console.log('Bid placed successfully:', data);
    res.json(data);
  } catch (error: any) {
    console.error('Error placing bid:', error);
    res.status(500).json({ error: error.message || 'Failed to place bid' });
  }
});

// PUT /auction/bid/:id - Place a bid or prebid on an auction (legacy endpoint)
router.put('/bid/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const auctionId = req.params.id;
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const response = await fetch(`${BASE_URL}/auction/bid/${auctionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error placing bid:', error);
    res.status(500).json({ error: error.message || 'Failed to place bid' });
  }
});

export default router;
