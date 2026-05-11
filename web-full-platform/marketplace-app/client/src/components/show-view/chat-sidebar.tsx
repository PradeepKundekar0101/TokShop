import { Send, X, Share2, Gift, DollarSign, ShoppingBag, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserBadge } from '@/components/user-badge';

interface ChatSidebarProps {
  showMobileChat: boolean;
  setShowMobileChat: (show: boolean) => void;
  isShowOwner: boolean;
  show: any;
  viewerCount: number;
  activeGiveaway: any;
  isAuthenticated: boolean;
  isFollowingHost: boolean;
  joinGiveawayMutation: any;
  handleFollowAndJoinGiveaway: () => void;
  setShowShareDialog: (show: boolean) => void;
  handleEndGiveaway: () => void;
  chatMessages: any[];
  chatScrollRef: any;
  renderMessageWithMentions: (message: string, mentions: any[]) => any;
  showMentionDialog: boolean;
  userSuggestions: any[];
  isSearchingUsers: boolean;
  selectMention: (name: string, id: string) => void;
  messageInputRef: any;
  message: string;
  handleMessageChange: (value: string) => void;
  handleSendMessage: (msg: string) => void;
  currentUserId: string;
  giveaways: any[];
  giveawayTimeLeft: number;
}

export function ChatSidebar(props: ChatSidebarProps) {
  const {
    showMobileChat,
    setShowMobileChat,
    isShowOwner,
    show,
    viewerCount,
    activeGiveaway,
    isAuthenticated,
    isFollowingHost,
    joinGiveawayMutation,
    handleFollowAndJoinGiveaway,
    setShowShareDialog,
    handleEndGiveaway,
    chatMessages,
    chatScrollRef,
    renderMessageWithMentions,
    showMentionDialog,
    userSuggestions,
    isSearchingUsers,
    selectMention,
    messageInputRef,
    message,
    handleMessageChange,
    handleSendMessage,
    currentUserId,
    giveaways,
    giveawayTimeLeft
  } = props;

  return (
    <div className={`
      ${showMobileChat ? 'fixed inset-0 z-50 bg-black' : 'hidden'}
      lg:flex lg:flex-col lg:relative lg:w-72 lg:z-auto
      bg-black border-l border-zinc-800 flex flex-col
    `} style={{ height: '90vh' }}>
      {/* Mobile Close Button */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h2 className="text-white font-semibold">Chat</h2>
        <button onClick={() => setShowMobileChat(false)} data-testid="button-close-chat">
          <X className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Show Stats Card - Above Chat */}
      {isShowOwner && (
        <div className="px-4 py-3 border-b border-zinc-800" data-testid="show-stats-card">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
            {/* Gross Sales */}
            <div className="relative overflow-hidden rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-zinc-400">Gross Sales</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400">
                  ${(show?.salesTotal || 0).toFixed(2)}
                </p>
              </div>
            </div>
            
            {/* Estimated Orders */}
            <div className="relative overflow-hidden rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-xs font-medium text-zinc-400">Estimated Orders</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {show?.salesCount || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Giveaway Card - Above Chat Tabs */}
      {activeGiveaway && !activeGiveaway.ended && (
        <div className="px-4 py-4 border-b border-zinc-800" data-testid="giveaway-card-chat">
          <div className="border border-zinc-700 rounded-2xl p-4 bg-black">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-bold text-lg mb-1">
                  {activeGiveaway.name || 'Giveaway'} #{giveaways.findIndex((g: any) => g._id === activeGiveaway._id) + 1 || '1'}
                </h3>
                <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                  <Gift className="h-4 w-4" />
                  <span>{activeGiveaway.participants?.length || 0} entries</span>
                </div>
              </div>
              <a 
                href="/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 text-xs underline hover:text-white transition-colors"
                data-testid="link-giveaway-terms"
              >
                Terms & Conditions
              </a>
            </div>

            {/* Action Buttons */}
            {isShowOwner ? (
              // Host sees countdown + "End Giveaway" button
              <div className="space-y-2">
                {giveawayTimeLeft > 0 && (
                  <div className="flex items-center justify-center gap-1.5 text-zinc-300 text-sm font-medium">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span>
                      {Math.floor(giveawayTimeLeft / 60)}:{(giveawayTimeLeft % 60).toString().padStart(2, '0')} remaining
                    </span>
                  </div>
                )}
                <button
                  onClick={handleEndGiveaway}
                  className="w-full h-11 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
                  data-testid="button-end-giveaway"
                >
                  End Giveaway
                </button>
              </div>
            ) : (() => {
              // Check if user already entered (handle both string IDs and objects)
              const participants = activeGiveaway.participants || [];
              const isAlreadyParticipant = participants.some((p: any) => 
                (typeof p === 'string' ? p : p.id || p._id) === currentUserId
              );
              return isAlreadyParticipant;
            })() ? (
              // User already entered
              <button
                disabled
                className="w-full h-11 rounded-full bg-green-600 text-white font-semibold text-sm opacity-80"
                data-testid="button-already-entered"
              >
                You're Entered!
              </button>
            ) : activeGiveaway.whocanenter === 'followers' && !isFollowingHost ? (
              // Giveaway requires following and user is not following
              <button
                onClick={handleFollowAndJoinGiveaway}
                disabled={joinGiveawayMutation.isPending}
                className="w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-colors disabled:opacity-50"
                data-testid="button-follow-to-enter"
              >
                {joinGiveawayMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  'Follow host to enter giveaway'
                )}
              </button>
            ) : isAuthenticated ? (
              // Can enter the giveaway (either open to everyone, or user is already following)
              <button
                onClick={() => joinGiveawayMutation.mutate()}
                disabled={joinGiveawayMutation.isPending}
                className="w-full h-11 rounded-full bg-white hover:bg-zinc-100 text-black font-semibold text-sm transition-colors disabled:opacity-50"
                data-testid="button-join-giveaway-chat"
              >
                {joinGiveawayMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  'Enter the giveaway'
                )}
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Show Not Started Prompt - Only for owner who hasn't started the show */}
      {isShowOwner && !show?.started && show?.date && (
        <div className="px-4 py-6 border-b border-zinc-800 flex flex-col items-center text-center" data-testid="show-not-started-prompt">
          <p className="text-zinc-400 text-sm mb-1">Show starts</p>
          <p className="text-white text-3xl font-bold mb-4">
            {new Date(show.date).toLocaleDateString('en-US', { weekday: 'short' })} {new Date(show.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </p>
          <button 
            className="w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base transition-colors flex items-center justify-center gap-2"
            data-testid="button-share-show"
            onClick={() => setShowShareDialog(true)}
          >
            <Share2 className="h-5 w-5" />
            Share Show
          </button>
        </div>
      )}

      {/* Chats Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <h3 className="text-white text-base font-semibold">Chats</h3>
      </div>

      {/* Chat Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div ref={chatScrollRef} className="flex-1 px-3 py-3 overflow-y-auto">
            <div className="space-y-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className="flex gap-2">
                  <Avatar 
                    className="h-6 w-6 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      if (msg.senderId) {
                        window.open(`/profile/${msg.senderId}`, '_blank');
                      }
                    }}
                  >
                    {msg.image_url && (
                      <AvatarImage src={msg.image_url} alt={msg.senderName} />
                    )}
                    <AvatarFallback className="text-xs">{msg.senderName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-xs font-semibold text-white cursor-pointer hover:underline"
                      onClick={() => {
                        if (msg.senderId) {
                          window.open(`/profile/${msg.senderId}`, '_blank');
                        }
                      }}
                    >
                      {msg.senderName}
                    </p>
                    <div className="text-xs">
                      {renderMessageWithMentions(msg.message, msg.mentions)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {isAuthenticated && (
            <div className="flex-shrink-0 p-3 border-t border-zinc-800 bg-black relative">
              {/* Mention Suggestions - Desktop */}
              {showMentionDialog && (
                <div className="absolute bottom-full left-3 right-3 mb-2 z-50">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="p-3 border-b border-zinc-800">
                      <h3 className="text-sm font-semibold text-white">Tag someone</h3>
                    </div>
                    <ScrollArea className="max-h-[300px]">
                      <div className="p-2">
                        {userSuggestions.map((suggestedUser) => (
                          <div
                            key={suggestedUser._id || suggestedUser.id}
                            onClick={() => selectMention(
                              suggestedUser.userName || suggestedUser.firstName,
                              suggestedUser._id || suggestedUser.id
                            )}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors"
                            data-testid={`mention-suggestion-${suggestedUser._id || suggestedUser.id}`}
                          >
                            <Avatar className="h-8 w-8">
                              {suggestedUser.profilePhoto && (
                                <AvatarImage src={suggestedUser.profilePhoto} alt={suggestedUser.userName} />
                              )}
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {(suggestedUser.userName || suggestedUser.firstName || 'A').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <p className="text-sm font-medium text-white truncate">
                                  {suggestedUser.userName || suggestedUser.firstName}
                                </p>
                                {(suggestedUser.badge || suggestedUser.badgeTier) && (
                                  <UserBadge badge={suggestedUser.badge} badgeTier={suggestedUser.badgeTier} size="sm" />
                                )}
                              </div>
                              {suggestedUser.firstName && suggestedUser.userName !== suggestedUser.firstName && (
                                <p className="text-xs text-zinc-400 truncate">
                                  {suggestedUser.firstName} {suggestedUser.lastName || ''}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        {isSearchingUsers && (
                          <div className="text-center py-6 text-zinc-400 text-sm">
                            Searching...
                          </div>
                        )}
                        {!isSearchingUsers && userSuggestions.length === 0 && (
                          <div className="text-center py-6 text-zinc-400 text-sm">
                            No users found
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Input
                  ref={messageInputRef}
                  placeholder="Say something..."
                  value={message}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && message.trim()) {
                      e.preventDefault();
                      handleSendMessage(message);
                    }
                  }}
                  className="flex-1 bg-zinc-900 border-zinc-800 text-white h-9"
                  data-testid="input-chat-message-desktop"
                />
                <Button
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => handleSendMessage(message)}
                  data-testid="button-send-message-desktop"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
