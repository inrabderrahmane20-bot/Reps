import type {Db,User} from '../types';
import {toPublicUser} from '../types';
export function exportAccount(db:Db,user:User){
 const id=user.id;
 return {exportedAt:new Date().toISOString(),account:{...toPublicUser(user,true),email:user.email,blockedUserIds:user.blockedUserIds},
  requests:db.serviceRequests.filter(r=>r.clientId===id||r.providerId===id),reviews:db.reviews.filter(r=>r.authorId===id),
  posts:db.communityPosts.filter(p=>p.authorId===id),messages:db.messages.filter(m=>m.senderId===id),roomMessages:db.roomMessages.filter(m=>m.senderId===id),
  meetingProfile:db.meetingProfiles.find(p=>p.userId===id),notifications:db.notifications.filter(n=>n.userId===id),favorites:db.favorites.filter(f=>f.userId===id),savedSearches:db.savedSearches.filter(s=>s.userId===id),listings:db.listings.filter(l=>l.sellerId===id)};
}
export function eraseAccount(db:Db,id:string){
 db.sessions=db.sessions.filter(s=>s.userId!==id);
 db.users=db.users.filter(u=>u.id!==id);
 for(const u of db.users)u.blockedUserIds=u.blockedUserIds.filter(x=>x!==id);
 db.serviceRequests=db.serviceRequests.filter(r=>r.clientId!==id&&r.providerId!==id);
 db.reviews=db.reviews.filter(r=>r.authorId!==id&&r.providerId!==id);
 db.messages=db.messages.filter(m=>m.senderId!==id);for(const m of db.messages)m.readBy=m.readBy.filter(x=>x!==id);
 db.roomMessages=db.roomMessages.filter(m=>m.senderId!==id);
 db.communityPosts=db.communityPosts.filter(p=>p.authorId!==id);
 for(const p of db.communityPosts){p.likeUserIds=p.likeUserIds.filter(x=>x!==id);p.comments=p.comments.filter(c=>c.authorId!==id);}
 for(const c of db.communities){c.memberIds=c.memberIds.filter(x=>x!==id);c.adminIds=c.adminIds.filter(x=>x!==id);if(c.creatorId===id)c.creatorId='deleted';}
 for(const a of db.activities){a.participantIds=a.participantIds.filter(x=>x!==id);a.pendingParticipantIds=a.pendingParticipantIds.filter(x=>x!==id);if(a.creatorId===id)a.creatorId='deleted';}
 for(const c of db.conversations)c.participantIds=c.participantIds.filter(x=>x!==id);
 for(const r of db.rooms)r.memberIds=r.memberIds.filter(x=>x!==id);
 db.meetingProfiles=db.meetingProfiles.filter(p=>p.userId!==id);db.meetingRequests=db.meetingRequests.filter(r=>r.senderId!==id&&r.receiverId!==id);
 db.notifications=db.notifications.filter(n=>n.userId!==id);db.favorites=db.favorites.filter(f=>f.userId!==id);db.savedSearches=db.savedSearches.filter(s=>s.userId!==id);
 db.invitations=db.invitations.filter(i=>i.senderId!==id&&i.receiverId!==id);db.listings=db.listings.filter(l=>l.sellerId!==id);
 db.reports=db.reports.filter(r=>r.reporterId!==id&&!(['user','provider'].includes(r.targetType)&&r.targetId===id));
}
