import { supabase } from '../supabaseClient.js';

export async function logUserActivity({ userId, userEmail, userName, action, details = {}, req }) {
  try {
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'BridgeUp Web Client';

    const logEntry = {
      user_id: userId || null,
      user_email: userEmail || null,
      user_name: userName || null,
      action: action, // 'LOGIN', 'LOGOUT', 'SIGNUP', 'PROFILE_UPDATE', 'CONNECT', 'DISCONNECT', 'MESSAGE_SENT', 'JOIN_GROUP', 'ASSIGNMENT_STATUS', 'MENTORSHIP_REQUEST'
      details: details,
      ip_address: ip,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('user_logs').insert(logEntry);
    if (error) {
      console.warn(`[AuditLog Warning] Could not save log (${action}):`, error.message);
    } else {
      console.log(`📝 [AuditLog] ${action} logged for ${userEmail || userId || 'guest'}`);
    }
  } catch (err) {
    console.warn('[AuditLog Exception]:', err.message);
  }
}
