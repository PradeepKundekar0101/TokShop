import type { Express } from "express";
import { BASE_URL, getAccessToken } from "../utils";
import { deleteImagesFromStorage } from "../firebase-admin";

export function registerShowRoutes(app: Express) {
  app.get("/api/users/public/profile/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const response = await fetch(`${BASE_URL}/users/public/profile/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'User not found' });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching public user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.get("/api/referral/stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/users/referalstats/${userId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch referral stats' }));
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ error: "Failed to fetch referral stats" });
    }
  });

  app.get("/api/admin/referral-logs", async (req, res) => {
    try {
      const username = req.query.username as string;
      const page = req.query.page as string || '1';

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      let url = `${BASE_URL}/users/referal/stats/logs?page=${encodeURIComponent(page)}`;
      if (username) {
        url += `&username=${encodeURIComponent(username)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch referral logs' }));
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching admin referral logs:", error);
      res.status(500).json({ error: "Failed to fetch referral logs" });
    }
  });

  app.get("/api/referral/logs", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: 'userId query parameter is required' });
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${BASE_URL}/users/referal/stats/logs?referrerId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch referral logs' }));
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching referral logs:", error);
      res.status(500).json({ error: "Failed to fetch referral logs" });
    }
  });

  // Get public user profile by ID - proxy to external API
  app.get("/api/profile/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const accessToken = (req.headers['x-access-token'] as string) ||
                          (req as any).session?.accessToken ||
                          (req.headers['authorization']?.startsWith('Bearer ') ? 
                           (req.headers['authorization'] as string).substring(7) : null);
      
      if (!accessToken) {
        return res.status(401).json({ error: 'No access token available' });
      }

      const response = await fetch(`${BASE_URL}/users/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Profile API returned ${response.status} for user ${id}`);
        return res.status(response.status).json({ error: 'Failed to fetch user profile' });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update room featured status - proxy to external API
  app.put("/api/rooms/features/:roomId", async (req, res) => {
    try {
      const { roomId } = req.params;
      console.log('Updating room featured status:', roomId, 'with data:', req.body);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Include auth token if available
      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const url = `${BASE_URL}/rooms/features/${roomId}`;
      console.log('Calling external API:', url);
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(req.body)
      });
      
      if (!response.ok) {
        console.error(`Tokshop API returned ${response.status}: ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        return res.status(response.status).json({ error: 'Failed to update featured status' });
      }

      const data = await response.json();
      console.log('Room featured status updated:', data);
      res.json(data);
    } catch (error) {
      console.error("Error updating room featured status:", error);
      res.status(500).json({ error: "Failed to update featured status" });
    }
  });

  // Get single room by ID - proxy to external API
  app.get("/api/rooms/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Fetching single room:', id);
      
      // Build query params
      const queryParams = new URLSearchParams();
      if (req.query.currentUserId) {
        queryParams.set('currentUserId', req.query.currentUserId as string);
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Include auth token if available
      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const url = `${BASE_URL}/rooms/${id}?${queryParams.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        console.error(`Tokshop API returned ${response.status}: ${response.statusText}`);
        return res.status(response.status).json({ error: 'Room not found' });
      }

      const data = await response.json();
      
      // Log what external API returns for activeauction
      const activeAuction = data.activeauction || data.activeAuction || data.active_auction;
      if (activeAuction) {
        console.log('🔍 EXTERNAL API activeauction bids:', activeAuction.bids);
        console.log('🔍 EXTERNAL API activeauction ended:', activeAuction.ended);
        console.log('🔍 EXTERNAL API activeauction winner:', activeAuction.winner);
      }
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching room from Tokshop API:", error);
      res.status(500).json({ error: "Failed to fetch room" });
    }
  });

  // Update room by ID - proxy to external API
  app.put("/api/rooms/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Updating room:', id, 'with data:', req.body);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Include auth token if available
      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Note: External API uses /rooms without /api prefix
      const url = `${BASE_URL}/rooms/${id}`;
      console.log('Calling external API:', url);
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(req.body)
      });
      
      if (!response.ok) {
        console.error(`Tokshop API returned ${response.status}: ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        return res.status(response.status).json({ error: 'Failed to update room' });
      }

      const data = await response.json();
      console.log('📋 PUT response data structure:', Object.keys(data));
      
      res.json(data);
    } catch (error) {
      console.error("Error updating room from Tokshop API:", error);
      res.status(500).json({ error: "Failed to update room" });
    }
  });

  // Delete room by ID - proxy to external API
  app.delete("/api/rooms/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Deleting room:', id);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Include auth token if available
      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Step 1: Fetch the room to get its thumbnail and preview_videos
      console.log('Fetching room details to clean up media:', id);
      const roomResponse = await fetch(`${BASE_URL}/rooms/${id}`, {
        method: 'GET',
        headers
      });

      if (roomResponse.ok) {
        const roomData = await roomResponse.json();
        const mediaUrls: string[] = [];

        // Collect thumbnail URL if exists
        if (roomData?.thumbnail && typeof roomData.thumbnail === 'string') {
          mediaUrls.push(roomData.thumbnail);
        }

        // Collect preview video URL if exists
        if (roomData?.preview_videos && typeof roomData.preview_videos === 'string') {
          mediaUrls.push(roomData.preview_videos);
        }

        // Step 2: Delete media from storage
        if (mediaUrls.length > 0) {
          console.log(`Found ${mediaUrls.length} media file(s) to delete from storage`);
          try {
            await deleteImagesFromStorage(mediaUrls);
            console.log('✅ Successfully deleted show media from storage');
          } catch (storageError) {
            // Log error but continue with room deletion
            console.error('⚠️ Error deleting media from storage:', storageError);
          }
        } else {
          console.log('No media files to delete from storage');
        }
      } else {
        console.warn('Could not fetch room details for media cleanup');
      }

      // Step 3: Delete the room
      // Build query params
      const queryParams = new URLSearchParams();
      if (req.query.destroy) {
        queryParams.set('destroy', req.query.destroy as string);
      }
      
      const queryString = queryParams.toString();
      const url = `${BASE_URL}/rooms/${id}${queryString ? `?${queryString}` : ''}`;
      console.log('Calling external API:', url);
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        console.error(`Tokshop API returned ${response.status}: ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        return res.status(response.status).json({ error: 'Failed to delete room' });
      }

      const data = await response.json();
      console.log('Room deleted successfully:', data);
      res.json(data);
    } catch (error) {
      console.error("Error deleting room from Tokshop API:", error);
      res.status(500).json({ error: "Failed to delete room" });
    }
  });

  // Create room (schedule show) - proxy to external API
  app.post("/api/rooms", async (req, res) => {
    try {
      console.log("Creating room/show via Tokshop API");
      console.log("Request body:", req.body);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Include auth token if available
      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const url = `${BASE_URL}/rooms`;
      console.log('Calling external API:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body)
      });

      if (!response.ok) {
        console.error(`Tokshop API returned ${response.status}: ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        return res.status(response.status).json({ error: 'Failed to create room' });
      }

      const data = await response.json();
      console.log('Room created successfully:', data);
      res.status(201).json(data);
    } catch (error) {
      console.error("Error creating room via Tokshop API:", error);
      res.status(500).json({ error: "Failed to create room" });
    }
  });

  // Rooms endpoint for homepage shows - proxy to external API
  app.get("/api/rooms", async (req, res) => {
    try {
      console.log("Proxying rooms request to Tokshop API");
      
      // Build query params manually to preserve empty parameters
      const params: string[] = [];
      if (req.query.page !== undefined) params.push(`page=${req.query.page}`);
      if (req.query.limit !== undefined) params.push(`limit=${req.query.limit}`);
      if (req.query.category !== undefined) params.push(`category=${req.query.category}`);
      if (req.query.userid !== undefined) params.push(`userid=${req.query.userid}`);
      if (req.query.currentUserId !== undefined) params.push(`currentUserId=${req.query.currentUserId}`);
      if (req.query.title !== undefined) params.push(`title=${req.query.title}`);
      if (req.query.status !== undefined) params.push(`status=${req.query.status}`);
      if (req.query.live !== undefined) params.push(`live=${req.query.live}`);
      if (req.query.featured !== undefined) params.push(`featured=${req.query.featured}`);
      if (req.query.ownerUsername !== undefined) params.push(`ownerUsername=${req.query.ownerUsername}`);

      const queryString = params.join('&');
      const url = `${BASE_URL}/rooms?${queryString}`;
      console.log('Calling external API:', url);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Include auth token if available
      const accessToken = getAccessToken(req);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let errorData;
        try { errorData = JSON.parse(errorBody); } catch { errorData = { error: errorBody || response.statusText }; }
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching rooms from Tokshop API:", error);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  // Get LiveKit token for room - proxy to external Tokshop API
  app.post("/livekit/token/dynamic", async (req, res) => {
    try {
      const { room: roomId, userId: clientUserId, userName, uuid } = req.body;

      console.log('🔑 Request body received:', req.body);

      // Require authentication
      if (!req.session?.user) {
        console.error('❌ Unauthorized: No session user');
        return res.status(401).json({ error: 'Authentication required' });
      }

      const accessToken = getAccessToken(req);
      if (!accessToken) {
        console.error('❌ No access token in session');
        return res.status(401).json({ error: 'Authentication required' });
      }

      const sessionUser = req.session.user;
      const userId = sessionUser._id || sessionUser.id;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };

      // Fetch room details to determine if user is owner
      const roomResponse = await fetch(`${BASE_URL}/rooms/${roomId}`, {
        method: 'GET',
        headers
      });

      if (!roomResponse.ok) {
        console.error('❌ Failed to fetch room details');
        return res.status(404).json({ error: 'Room not found' });
      }

      const room = await roomResponse.json();
      
      // Determine role based on ownership
      const rawOwnerId = room.owner?._id || room.owner?.id;
      const showOwnerId = String(rawOwnerId);
      const normalizedUserId = String(userId);
      const isHost = normalizedUserId === showOwnerId;
      const role = isHost ? 'host' : 'audience';

      console.log('🔐 Role determination:', { 
        userId: normalizedUserId,
        showOwnerId,
        isHost,
        role
      });

      const requestBody = {
        room: roomId,
        userId: clientUserId || userId,
        userName: userName,
        role: role,
        uuid: uuid || ''
      };

      console.log('📤 Sending to external API:', requestBody);

      // Proxy request to external Tokshop API
      const response = await fetch(`${BASE_URL}/livekit/token/dynamic`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Tokshop API returned ${response.status}:`, errorText);
        return res.status(response.status).json({ 
          error: errorText || 'Failed to get LiveKit token from external API' 
        });
      }

      const data = await response.json();
      console.log('✅ LiveKit token received from Tokshop API');

      // Add the role we determined to the response
      res.json({
        ...data,
        role: role
      });
    } catch (error) {
      console.error('❌ Error proxying LiveKit token request:', error);
      res.status(500).json({ error: 'Failed to get LiveKit token' });
    }
  });
}