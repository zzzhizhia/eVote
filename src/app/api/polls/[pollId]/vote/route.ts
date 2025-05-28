
// src/app/api/polls/[pollId]/vote/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/lib/server/db';
import { parseISO } from 'date-fns';

export async function POST(request: NextRequest, { params }: { params: { pollId: string } }) {
  const { pollId } = params;
  try {
    const { candidateIds } = await request.json() as { candidateIds: string[] };
    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json({ message: 'Candidate IDs are required' }, { status: 400 });
    }

    const db = getDb();

    // Check if poll is open
    const pollRes = await db.query('SELECT is_open, scheduled_close_time FROM polls WHERE id = $1', [pollId]);
    if (pollRes.rows.length === 0) {
      return NextResponse.json({ message: 'Poll not found' }, { status: 404 });
    }

    let { is_open: isOpen, scheduled_close_time: scheduledCloseTime } = pollRes.rows[0];
    
    const now = new Date();
    if (scheduledCloseTime && now >= parseISO(scheduledCloseTime)) {
      isOpen = false;
      // Optionally update the DB here if poll status needs to be permanently closed by this action
      // await db.query('UPDATE polls SET is_open = FALSE WHERE id = $1 AND is_open = TRUE', [pollId]);
    }

    if (!isOpen) {
      return NextResponse.json({ message: 'Poll is closed' }, { status: 403 });
    }

    await db.query('BEGIN');
    for (const candidateId of candidateIds) {
      await db.query('UPDATE candidates SET votes = votes + 1 WHERE id = $1 AND poll_id = $2', [candidateId, pollId]);
    }
    await db.query('COMMIT');

    return NextResponse.json({ success: true });
  } catch (error) {
    await getDb().query('ROLLBACK');
    console.error(`Error submitting vote for poll ${pollId}:`, error);
    return NextResponse.json({ message: 'Error submitting vote' }, { status: 500 });
  }
}
