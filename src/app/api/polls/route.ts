
// src/app/api/polls/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getDb, initializeDbSchema } from '@/lib/server/db';
import { isAdminSession, getSession } from '@/lib/server/auth';
import type { Poll, PollCandidate } from '@/lib/types';

// Ensure DB schema is checked/initialized on first API call in dev
if (process.env.NODE_ENV === 'development') {
  initializeDbSchema();
}

export async function GET() {
  try {
    const db = getDb();
    const pollsRes = await db.query('SELECT * FROM polls ORDER BY created_at DESC');
    const polls: Poll[] = [];

    for (const pollRow of pollsRes.rows) {
      const candidatesRes = await db.query('SELECT * FROM candidates WHERE poll_id = $1 ORDER BY name ASC', [pollRow.id]);
      const candidates: PollCandidate[] = candidatesRes.rows.map(c => ({
        id: c.id,
        name: c.name,
        avatarUrl: c.avatar_url,
        dataAiHint: c.data_ai_hint,
        // votes will be part of the candidate row in the db
      }));
      
      // Reconstruct votes object for the Poll type
      const votes: { [candidateId: string]: number } = {};
      candidatesRes.rows.forEach(c => {
        votes[c.id] = c.votes;
      });

      polls.push({
        id: pollRow.id,
        title: pollRow.title,
        isOpen: pollRow.is_open,
        scheduledCloseTime: pollRow.scheduled_close_time ? new Date(pollRow.scheduled_close_time).toISOString() : null,
        voteLimitEnabled: pollRow.vote_limit_enabled,
        maxVotesPerClient: pollRow.max_votes_per_client,
        isMultiSelect: pollRow.is_multi_select,
        maxSelections: pollRow.max_selections,
        candidates,
        votes, // Reconstructed from candidate votes
      });
    }
    return NextResponse.json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    return NextResponse.json({ message: 'Error fetching polls' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!await isAdminSession(session)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pollData: Poll = await request.json();
    const db = getDb();
    const pollId = pollData.id || `${Date.now()}${Math.random().toString(36).substring(2, 9)}`;

    await db.query('BEGIN');
    await db.query(
      `INSERT INTO polls (id, title, is_open, scheduled_close_time, vote_limit_enabled, max_votes_per_client, is_multi_select, max_selections, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        pollId,
        pollData.title,
        pollData.isOpen,
        pollData.scheduledCloseTime || null,
        pollData.voteLimitEnabled || false,
        pollData.maxVotesPerClient || 1,
        pollData.isMultiSelect || false,
        pollData.maxSelections || 1,
      ]
    );

    for (const candidate of pollData.candidates) {
      const candidateId = candidate.id || `${Date.now()}${Math.random().toString(36).substring(2, 9)}`;
      await db.query(
        'INSERT INTO candidates (id, poll_id, name, avatar_url, data_ai_hint, votes) VALUES ($1, $2, $3, $4, $5, $6)',
        [candidateId, pollId, candidate.name, candidate.avatarUrl, candidate.dataAiHint, 0]
      );
    }
    await db.query('COMMIT');
    
    // Fetch the created poll to return it with all defaults applied by DB
    const createdPollRes = await db.query('SELECT * FROM polls WHERE id = $1', [pollId]);
    const candidatesRes = await db.query('SELECT * FROM candidates WHERE poll_id = $1', [pollId]);
     const createdCandidates: PollCandidate[] = candidatesRes.rows.map(c => ({
        id: c.id, name: c.name, avatarUrl: c.avatar_url, dataAiHint: c.data_ai_hint,
     }));
     const createdVotes: { [candidateId: string]: number } = {};
      candidatesRes.rows.forEach(c => {
        createdVotes[c.id] = c.votes;
      });

    const fullCreatedPoll: Poll = {
        ...createdPollRes.rows[0],
        isOpen: createdPollRes.rows[0].is_open,
        scheduledCloseTime: createdPollRes.rows[0].scheduled_close_time ? new Date(createdPollRes.rows[0].scheduled_close_time).toISOString() : null,
        voteLimitEnabled: createdPollRes.rows[0].vote_limit_enabled,
        maxVotesPerClient: createdPollRes.rows[0].max_votes_per_client,
        isMultiSelect: createdPollRes.rows[0].is_multi_select,
        maxSelections: createdPollRes.rows[0].max_selections,
        candidates: createdCandidates,
        votes: createdVotes,
    };


    return NextResponse.json(fullCreatedPoll, { status: 201 });
  } catch (error) {
    await getDb().query('ROLLBACK');
    console.error('Error creating poll:', error);
    return NextResponse.json({ message: 'Error creating poll' }, { status: 500 });
  }
}
