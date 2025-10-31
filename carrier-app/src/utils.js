import { nanoid } from 'nanoid';

// Generate unique ID
function generateId() {
  return nanoid();
}

// Get current timestamp
function now() {
  return Date.now();
}

// Find or create thread between two users
function findOrCreateThread(threads, aId, bId) {
  // Normalize order (smaller ID first)
  const [userId1, userId2] = [aId, bId].sort();
  
  let thread = threads.find(t => 
    (t.a_id === userId1 && t.b_id === userId2) ||
    (t.a_id === userId2 && t.b_id === userId1)
  );
  
  if (!thread) {
    thread = {
      id: generateId(),
      a_id: userId1,
      b_id: userId2,
      last_at: now()
    };
    threads.push(thread);
  }
  
  return thread;
}

// Update thread last activity
function updateThreadActivity(threads, threadId) {
  const thread = threads.find(t => t.id === threadId);
  if (thread) {
    thread.last_at = now();
  }
}

// Get threads for a user
function getUserThreads(threads, userId) {
  return threads
    .filter(t => t.a_id === userId || t.b_id === userId)
    .sort((a, b) => b.last_at - a.last_at);
}

export {
  generateId,
  now,
  findOrCreateThread,
  updateThreadActivity,
  getUserThreads
};