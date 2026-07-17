import { useTranslation } from 'react-i18next';
import { Star, ThumbsUp } from 'lucide-react';
import { formatRelative } from '@/utils/formatters';
import { reviewApi } from '@/services/reviewApi';
import { useState } from 'react';
import { cn } from '@/utils/cn';
export const ReviewCard = ({ review, hotelId }) => {
  const { t } = useTranslation();
  const [votes, setVotes] = useState(review.helpfulVotes || 0);
  const [voted, setVoted] = useState(false);
  const handleVote = async () => {
    try { const { data } = await reviewApi.voteHelpful(hotelId, review._id); setVotes(data.data.helpfulVotes); setVoted(data.data.voted); } catch {}
  };
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-neutral-900 font-bold flex-shrink-0">{review.userId?.name?.[0]?.toUpperCase() || 'G'}</div>
          <div><p className="font-medium text-neutral-900 text-sm">{review.userId?.name || 'Guest'}</p><p className="text-xs text-neutral-400">{formatRelative(review.createdAt)}{review.travelType && ' · ' + review.travelType}</p></div>
        </div>
        <div className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_,i) => <Star key={i} className={cn('w-3.5 h-3.5', i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-neutral-500')} />)}</div>
      </div>
      {review.title && <p className="font-semibold text-neutral-900 text-sm mb-2">{review.title}</p>}
      <p className="text-sm text-neutral-600 leading-relaxed mb-4">{review.comment}</p>
      {review.hotelResponse?.text && (
        <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-200">
          <p className="text-xs font-semibold text-amber-500 mb-1">Management Response</p>
          <p className="text-xs text-neutral-600">{review.hotelResponse.text}</p>
        </div>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-200 mt-3">
        <span className="text-xs text-neutral-400">{review.isVerified && '✓ Verified stay'}</span>
        <button onClick={handleVote} className={cn('flex items-center gap-1.5 text-xs transition-colors', voted ? 'text-amber-500' : 'text-neutral-400 hover:text-neutral-600')}>
          <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({votes})
        </button>
      </div>
    </div>
  );
};
