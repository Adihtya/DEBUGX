/**
// ==============================================================================
// DEBUGX — SUPABASE DEBUGGING HISTORY SERVICE
// Manages debugging_history table in Supabase PostgreSQL
// ==============================================================================
*/

class DebuggingService {
  constructor() {
    this.localKey = 'debugx_history';
  }

  /**
   * Save a debugging session to Supabase PostgreSQL (and local storage backup)
   */
  async saveSession(userId, debugResponse, originalCode = '') {
    const sessionRecord = {
      id: debugResponse.id || ('sess_' + Date.now()),
      title: debugResponse.errorTitle || 'Code Diagnosis',
      programming_language: debugResponse.language || 'Python',
      original_code: originalCode || debugResponse.originalCode || '',
      error_message: debugResponse.summary || '',
      error_type: debugResponse.errorCategory || 'Runtime Error',
      root_cause: debugResponse.rootCause || '',
      corrected_code: debugResponse.correctedCode || '',
      explanation: debugResponse.explanation || [],
      severity: debugResponse.severity || 'Medium',
      created_at: new Date().toISOString()
    };

    // Save to local backup
    this._saveToLocal(sessionRecord);

    const client = window.supabaseManager?.getClient();
    if (client && window.supabaseManager.isLiveConnected && userId && !userId.startsWith('usr_demo_')) {
      try {
        const { error } = await client
          .from('debugging_history')
          .insert([{
            user_id: userId,
            title: sessionRecord.title,
            programming_language: sessionRecord.programming_language,
            original_code: sessionRecord.original_code,
            error_message: sessionRecord.error_message,
            error_type: sessionRecord.error_type,
            root_cause: sessionRecord.root_cause,
            corrected_code: sessionRecord.corrected_code,
            explanation: sessionRecord.explanation,
            severity: sessionRecord.severity
          }]);

        if (error) {
          console.warn('[DebuggingService] PostgreSQL insert warning:', error);
        } else {
          console.log('[DebuggingService] Session successfully recorded in Supabase PostgreSQL');
        }
      } catch (err) {
        console.warn('[DebuggingService] saveSession network error:', err);
      }
    }

    return sessionRecord;
  }

  /**
   * Retrieve history for the authenticated user from Supabase (or fallback to local)
   */
  async getHistory(userId, limit = 50) {
    const client = window.supabaseManager?.getClient();

    if (client && window.supabaseManager.isLiveConnected && userId && !userId.startsWith('usr_demo_')) {
      try {
        const { data, error } = await client
          .from('debugging_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(this._mapFromDbRecord);
        }
      } catch (err) {
        console.warn('[DebuggingService] getHistory PostgreSQL fetch error:', err);
      }
    }

    return this._getFromLocal();
  }

  /**
   * Delete a debugging record
   */
  async deleteSession(sessionId, userId) {
    this._deleteFromLocal(sessionId);

    const client = window.supabaseManager?.getClient();
    if (client && window.supabaseManager.isLiveConnected && userId && !userId.startsWith('usr_demo_')) {
      try {
        await client
          .from('debugging_history')
          .delete()
          .eq('id', sessionId)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('[DebuggingService] deleteSession error:', err);
      }
    }
  }

  /**
   * Clear all debugging records for a user
   */
  async clearHistory(userId) {
    localStorage.removeItem(this.localKey);

    const client = window.supabaseManager?.getClient();
    if (client && window.supabaseManager.isLiveConnected && userId && !userId.startsWith('usr_demo_')) {
      try {
        await client
          .from('debugging_history')
          .delete()
          .eq('user_id', userId);
      } catch (err) {
        console.warn('[DebuggingService] clearHistory error:', err);
      }
    }
  }

  // --- Local Fallback Helpers ---
  _saveToLocal(record) {
    try {
      const existing = this._getFromLocal();
      const updated = [record, ...existing.filter(i => i.id !== record.id)].slice(0, 50);
      localStorage.setItem(this.localKey, JSON.stringify(updated));
    } catch (e) {}
  }

  _getFromLocal() {
    try {
      const raw = localStorage.getItem(this.localKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  _deleteFromLocal(id) {
    try {
      const existing = this._getFromLocal();
      const updated = existing.filter(i => i.id !== id);
      localStorage.setItem(this.localKey, JSON.stringify(updated));
    } catch (e) {}
  }

  _mapFromDbRecord(row) {
    return {
      id: row.id,
      language: row.programming_language,
      errorTitle: row.title,
      errorCategory: row.error_type,
      severity: row.severity,
      summary: row.error_message,
      rootCause: row.root_cause,
      originalCode: row.original_code,
      correctedCode: row.corrected_code,
      explanation: Array.isArray(row.explanation) ? row.explanation : [row.explanation || ''],
      timestamp: new Date(row.created_at).toLocaleDateString()
    };
  }
}

window.debuggingService = new DebuggingService();
