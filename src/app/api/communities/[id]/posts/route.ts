import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { readDb, updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

function enrichPost(p: any, db: any) {
  const author = db.users.find((u: any) => u.id === p.authorId);
  return {
    ...p,
    authorName: author ? `${author.firstName} ${author.lastName}` : 'Unknown',
    authorAvatar: author?.avatar,
    likeCount: p.likeUserIds.length,
    commentCount: p.comments.length,
    comments: p.comments.map((c: any) => {
      const a = db.users.find((u: any) => u.id === c.authorId);
      return { ...c, authorName: a ? `${a.firstName} ${a.lastName}` : 'Unknown' };
    }),
  };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = readDb();
  const posts = db.communityPosts
    .filter((p) => p.communityId === params.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((p) => enrichPost(p, db));
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const me = requireUser();
    const { content } = await req.json();
    if (!content || !content.trim()) return jsonError('Post content is required.');

    const db = readDb();
    const community = db.communities.find((c) => c.id === params.id);
    if (!community) return jsonError('Community not found.', 404);
    if (!community.memberIds.includes(me.id)) return jsonError('Join the community to post.', 403);

    const id = newId('cp');
    updateDb((d) => {
      d.communityPosts.push({
        id,
        communityId: params.id,
        authorId: me.id,
        content,
        createdAt: new Date().toISOString(),
        likeUserIds: [],
        comments: [],
      });
    });
    return NextResponse.json({ id }, { status: 201 });
  });
}
