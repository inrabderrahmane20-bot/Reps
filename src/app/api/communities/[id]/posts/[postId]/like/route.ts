import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { updateDb } from '@/lib/db';
import { withErrors, jsonError } from '@/lib/api-helpers';

export async function POST(_req: Request, { params }: { params: { id: string; postId: string } }) {
  return withErrors(async () => {
    const me = requireUser();
    const result = updateDb((db) => {
      const post = db.communityPosts.find((p) => p.id === params.postId && p.communityId === params.id);
      if (!post) return null;
      const liked = post.likeUserIds.includes(me.id);
      post.likeUserIds = liked ? post.likeUserIds.filter((id) => id !== me.id) : [...post.likeUserIds, me.id];
      return { liked: !liked, likeCount: post.likeUserIds.length };
    });
    if (!result) return jsonError('Post not found.', 404);
    return NextResponse.json(result);
  });
}
