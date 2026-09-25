import { AccessToken } from 'livekit-server-sdk';
import { env } from '../../config/env.js';

class LiveKitService {
  isConfigured() {
    return Boolean(env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET && env.LIVEKIT_URL);
  }

  /**
   * Generates a signed LiveKit AccessToken for a participant joining a training room.
   *
   * @param {Object} params
   * @param {string} params.trainingId - Unique training identifier
   * @param {string} [params.participantId] - User or SME ID
   * @param {string} [params.participantName] - Display name
   * @param {boolean} [params.isHost] - True if presenter/banker, false if attendee
   * @returns {Promise<{ token: string, url: string, room: string, identity: string, name: string }>}
   */
  async generateToken({ trainingId, participantId, participantName, isHost = false }) {
    const apiKey = env.LIVEKIT_API_KEY;
    const apiSecret = env.LIVEKIT_API_SECRET;
    const livekitUrl = env.LIVEKIT_URL;

    if (!this.isConfigured()) {
      throw new Error('LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL must be configured');
    }

    const roomName = `training_${trainingId}`;
    const identity = participantId ? String(participantId) : (isHost ? 'host' : `attendee_${Date.now()}`);
    const name = participantName || (isHost ? 'Trainer / Host' : 'SME Attendee');

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name,
      ttl: '4h',
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true, // Host publishes screen & camera; attendees can publish mic when speaking
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return {
      token,
      url: livekitUrl,
      room: roomName,
      identity,
      name,
    };
  }
}

export default new LiveKitService();
