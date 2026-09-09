import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { updateDb, newId } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

export async function POST(req: Request, { params }: { params: { id: string; postId: string } }) {
  return withErrors(async () => {
    const me = requireUser();
    const { content } = await req.json();
    if (!content || !content.trim()) return jsonError('Comment cannot be empty.');
    const result = updateDb((db) => {
      const post = db.communityPosts.find((p) => p.id === params.postId && p.communityId === params.id);
      if (!post) return null;
      const comment = { id: newId('cm'), authorId: me.id, content, createdAt: new Date().toISOString() };
      post.comments.push(comment);
      return { commentCount: post.comments.length };
    });
    if (!result) return jsonError('Post not found.', 404);
    return NextResponse.json(result, { status: 201 });
  });
}
