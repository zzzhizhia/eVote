
// src/app/api/polls/[pollId]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/lib/server/db';
import { isAdminSession, getSession } from '@/lib/server/auth';
import type { Poll, PollCandidate } from '@/lib/types';

export async function GET(request: NextRequest, { params }: { params: { pollId: string } }) {
  const { pollId } = params;
  try {
    const db = getDb();
    const pollRes = await db.query('SELECT * FROM polls WHERE id = $1', [pollId]);
    if (pollRes.rows.length === 0) {
      return NextResponse.json({ message: 'Poll not found' }, { status: 404 });
    }

    const pollRow = pollRes.rows[0];
    const candidatesRes = await db.query('SELECT * FROM candidates WHERE poll_id = $1 ORDER BY name ASC', [pollId]);
    const candidates: PollCandidate[] = candidatesRes.rows.map(c => ({
      id: c.id,
      name: c.name,
      avatarUrl: c.avatar_url,
      dataAiHint: c.data_ai_hint,
    }));
    
    const votes: { [candidateId: string]: number } = {};
    candidatesRes.rows.forEach(c => {
      votes[c.id] = c.votes;
    });

    const poll: Poll = {
      id: pollRow.id,
      title: pollRow.title,
      isOpen: pollRow.is_open,
      scheduledCloseTime: pollRow.scheduled_close_time ? new Date(pollRow.scheduled_close_time).toISOString() : null,
      voteLimitEnabled: pollRow.vote_limit_enabled,
      maxVotesPerClient: pollRow.max_votes_per_client,
      isMultiSelect: pollRow.is_multi_select,
      maxSelections: pollRow.max_selections,
      candidates,
      votes,
    };
    return NextResponse.json(poll);
  } catch (error) {
    console.error(`Error fetching poll ${pollId}:`, error);
    return NextResponse.json({ message: 'Error fetching poll' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { pollId: string } }) {
  const session = await getSession();
  if (!await isAdminSession(session)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { pollId } = params;
  try {
    const pollData: Poll = await request.json();
    const db = getDb();

    await db.query('BEGIN');
    await db.query(
      `UPDATE polls SET 
        title = $1, is_open = $2, scheduled_close_time = $3, 
        vote_limit_enabled = $4, max_votes_per_client = $5, 
        is_multi_select = $6, max_selections = $7
       WHERE id = $8`,
      [
        pollData.title,
        pollData.isOpen,
        pollData.scheduledCloseTime || null,
        pollData.voteLimitEnabled || false,
        pollData.maxVotesPerClient || 1,
        pollData.isMultiSelect || false,
        pollData.maxSelections || 1,
        pollId,
      ]
    );

    // Simplistic candidate update: delete existing and re-insert.
    // A more sophisticated approach would involve diffing and updating/inserting/deleting selectively.
    await db.query('DELETE FROM candidates WHERE poll_id = $1', [pollId]);
    for (const candidate of pollData.candidates) {
      const candidateId = candidate.id || `${Date.now()}${Math.random().toString(36).substring(2, 9)}`;
      // Preserve existing votes if candidate ID matches an old one (not fully implemented here for brevity)
      // For now, new/updated candidates reset votes when poll is edited.
      // A better way: fetch existing votes, map them, and re-apply.
      const existingVoteCount = pollData.votes[candidate.id] || 0;

      await db.query(
        'INSERT INTO candidates (id, poll_id, name, avatar_url, data_ai_hint, votes) VALUES ($1, $2, $3, $4, $5, $6)',
        [candidateId, pollId, candidate.name, candidate.avatarUrl, candidate.dataAiHint, existingVoteCount]
      );
    }
    await db.query('COMMIT');
    return NextResponse.json({ success: true, id: pollId });
  } catch (error) {
    await getDb().query('ROLLBACK');
    console.error(`Error updating poll ${pollId}:`, error);
    return NextResponse.json({ message: 'Error updating poll' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { pollId: string } }) {
  const session = await getSession();
  if (!await isAdminSession(session)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { pollId } = params;
  try {
    const db = getDb();
    // ON DELETE CASCADE should handle candidates
    await db.query('DELETE FROM polls WHERE id = $1', [pollId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting poll ${pollId}:`, error);
    return NextResponse.json({ message: 'Error deleting poll' }, { status: 500 });
  }
}
