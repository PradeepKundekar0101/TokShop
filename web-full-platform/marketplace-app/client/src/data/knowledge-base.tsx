import { 
  BookOpen, 
  Layout, 
  Users, 
  ShoppingBag, 
  Gavel, 
  Gift, 
  CreditCard, 
  Package, 
  Settings, 
  BarChart3, 
  Shield, 
  Zap, 
  Globe,
  Smartphone,
  Video,
  MessageSquare,
  TrendingUp,
  Clock,
  DollarSign,
  Star,
  Mail,
  Database,
  Truck,
  Printer,
  FileText,
  type LucideIcon
} from "lucide-react";

export interface KnowledgeBaseSection {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  content: {
    title: string;
    body: string | React.ReactNode;
  }[];
}

export const getKnowledgeBaseSections = (appName: string = 'TokshopLive'): KnowledgeBaseSection[] => [
  {
    id: "overview",
    title: `What is ${appName}?`,
    icon: BookOpen,
    description: "Introduction to the platform",
    content: [
      {
        title: "Welcome to Live Shopping",
        body: `${appName} is a live streaming shopping platform where you can watch exciting live shows, interact with sellers in real-time, and purchase products instantly. It's like watching your favorite shopping channel, but interactive - you can chat, ask questions, and buy products with just a few taps. Whether you're looking for great deals, unique items, or just entertainment, ${appName} brings the shopping mall experience to your screen.`
      },
      {
        title: "How It Works",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">{appName} connects buyers and sellers through live video streaming:</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Video className="h-8 w-8 text-primary" />
                <h5 className="font-semibold">Watch Live Shows</h5>
                <p className="text-sm text-muted-foreground">Sellers host live video shows demonstrating products, answering questions, and offering special deals in real-time.</p>
              </div>
              <div className="space-y-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                <h5 className="font-semibold">Chat & Interact</h5>
                <p className="text-sm text-muted-foreground">Ask questions, chat with other viewers, and get instant responses from sellers during the show.</p>
              </div>
              <div className="space-y-2">
                <ShoppingBag className="h-8 w-8 text-primary" />
                <h5 className="font-semibold">Buy Instantly</h5>
                <p className="text-sm text-muted-foreground">Purchase products with one click, participate in auctions, or enter giveaways - all while watching the show.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Available on Web and Mobile",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Shop anywhere, anytime:</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="border rounded-lg p-4">
                <Globe className="h-6 w-6 text-primary mb-2" />
                <h5 className="font-semibold text-sm mb-1">Web Browser</h5>
                <p className="text-xs text-muted-foreground">Access the full platform from any computer or laptop browser. Great for browsing products and managing seller tools.</p>
              </div>
              <div className="border rounded-lg p-4">
                <Smartphone className="h-6 w-6 text-primary mb-2" />
                <h5 className="font-semibold text-sm mb-1">Mobile Apps</h5>
                <p className="text-xs text-muted-foreground">Download our iOS and Android apps for shopping on the go. Perfect for watching live shows anywhere.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        title: `Why Shop on ${appName}?`,
        body: (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Exclusive Deals</p>
                  <p className="text-sm text-muted-foreground">Get special prices and limited-time offers only available during live shows</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Video className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">See Before You Buy</p>
                  <p className="text-sm text-muted-foreground">Watch products demonstrated live - see how they work and look in real-time</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Ask Questions</p>
                  <p className="text-sm text-muted-foreground">Get instant answers from sellers - no waiting for email responses</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Gavel className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Win Auctions</p>
                  <p className="text-sm text-muted-foreground">Bid on unique items and score great deals through exciting auctions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Gift className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Free Giveaways</p>
                  <p className="text-sm text-muted-foreground">Enter to win free products during live shows - no purchase necessary</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Secure Shopping</p>
                  <p className="text-sm text-muted-foreground">Your payments and personal information are protected</p>
                </div>
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: "getting-started-buyers",
    title: "Getting Started as a Buyer",
    icon: ShoppingBag,
    description: "How to shop and participate",
    content: [
      {
        title: "Creating Your Account",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Getting started is easy:</p>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span>Click "Sign Up" on the homepage</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span>Choose to sign up with Google, Facebook, or email</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span>Complete your profile with a photo and display name</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span>Start browsing shows and products!</span>
              </li>
            </ol>
          </div>
        )
      },
      {
        title: "Browsing Live Shows",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Find shows that interest you:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>For You Page:</strong> See recommended shows based on your interests</li>
              <li><strong>Categories:</strong> Browse by Fashion, Electronics, Beauty, Home & Garden, and more</li>
              <li><strong>Search:</strong> Look for specific products or sellers</li>
              <li><strong>Trending:</strong> Check out the most popular shows happening now</li>
              <li><strong>Following:</strong> See shows from sellers you follow</li>
            </ul>
          </div>
        )
      },
      {
        title: "Watching a Live Show",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">Once you join a show, you can:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Video className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">Watch in High Quality</p>
                  <p className="text-sm text-muted-foreground">Enjoy smooth, high-definition video streaming that adjusts to your internet speed</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">Chat with Everyone</p>
                  <p className="text-sm text-muted-foreground">Send messages visible to all viewers and the seller - ask questions or share excitement</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShoppingBag className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">View Featured Products</p>
                  <p className="text-sm text-muted-foreground">See which products the seller is currently showing - click to view details and purchase</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">React and Engage</p>
                  <p className="text-sm text-muted-foreground">Send reactions and emojis to show appreciation for products you love</p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Making Your First Purchase",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">Buying is quick and easy:</p>
            <ol className="space-y-3 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <div className="space-y-1">
                  <p><strong>Add Payment Method</strong></p>
                  <p className="text-xs">Go to your profile and add a credit or debit card - your information is stored securely</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <div className="space-y-1">
                  <p><strong>Add Shipping Address</strong></p>
                  <p className="text-xs">Save your delivery address so you're ready to check out quickly</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <div className="space-y-1">
                  <p><strong>Buy a Product</strong></p>
                  <p className="text-xs">Click "Buy Now" or "Add to Cart" on any product - during a show or while browsing</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <div className="space-y-1">
                  <p><strong>Complete Checkout</strong></p>
                  <p className="text-xs">Review your order and confirm - you'll receive an email confirmation instantly</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <div className="space-y-1">
                  <p><strong>Track Your Order</strong></p>
                  <p className="text-xs">Check your order status anytime in "My Orders" - get updates when it ships</p>
                </div>
              </li>
            </ol>
          </div>
        )
      }
    ]
  },
  {
    id: "auctions",
    title: "How Auctions Work",
    icon: Gavel,
    description: "Bidding and winning items",
    content: [
      {
        title: "What are Auctions?",
        body: "Auctions let you compete with other buyers to win products at potentially lower prices. You place bids (offers to pay a certain amount), and whoever has the highest bid when the auction ends wins the item and pays their final bid amount. It's exciting because you might get a great deal, but you'll need to bid strategically to win!"
      },
      {
        title: "Two Types of Auctions",
        body: (
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h5 className="font-semibold mb-2">Featured Auctions (Long-Term)</h5>
              <p className="text-sm text-muted-foreground mb-2">These are special auctions that run for hours, days, or even weeks:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Displayed prominently on the homepage</li>
                <li>• Perfect for high-value or rare items</li>
                <li>• You can bid anytime before the auction ends</li>
                <li>• Great if you can't watch a live show but still want to bid</li>
              </ul>
            </div>
            <div className="border-l-4 border-red-500 pl-4">
              <h5 className="font-semibold mb-2">Show Auctions (Fast & Exciting)</h5>
              <p className="text-sm text-muted-foreground mb-2">These happen during live shows and last just a few minutes:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• The seller demonstrates the product live on camera</li>
                <li>• Bidding is fast-paced and exciting</li>
                <li>• You compete in real-time with other viewers</li>
                <li>• Winner announced immediately when auction ends</li>
                <li>• Creates a fun, competitive atmosphere</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: "How to Place a Bid",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">Bidding is simple:</p>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span><strong>Find an Active Auction:</strong> Look for items marked "Live Auction" on the homepage or during shows</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span><strong>Check Current Bid:</strong> See the current highest bid and minimum next bid amount</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span><strong>Enter Your Bid:</strong> Type in an amount equal to or higher than the minimum</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span><strong>Confirm Your Bid:</strong> Review and submit - remember, bids are binding commitments to buy</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <span><strong>Watch the Auction:</strong> You'll see if someone outbids you - you can bid again if you want</span>
              </li>
            </ol>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-4">
              <p className="text-sm font-medium mb-1">💡 Important to Know:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• You must have a payment method and shipping address saved before bidding</li>
                <li>• If you win, you're required to purchase the item at your final bid price</li>
                <li>• You cannot cancel a bid once placed</li>
                <li>• Winning bidders are automatically charged when the auction ends</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: "Bidding Options",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">You have multiple ways to bid on auctions:</p>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h5 className="font-semibold mb-2">Quick Bid (Instant)</h5>
              <p className="text-sm text-muted-foreground mb-2">Click a preset bid button (e.g., "Bid: $50") to place an immediate bid at that exact amount. No autobid protection - you'll need to bid again if someone outbids you.</p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h5 className="font-semibold mb-2">Custom Bid without Autobid</h5>
              <p className="text-sm text-muted-foreground mb-2">Enter any amount you want (e.g., $100) and place an immediate bid at exactly that price. No autobid protection.</p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h5 className="font-semibold mb-2">Custom Bid with Autobid (Recommended)</h5>
              <p className="text-sm text-muted-foreground mb-2">Set a maximum amount you're willing to pay, and the system automatically bids for you up to that limit. This is the smartest way to bid!</p>
              
              <div className="mt-3 space-y-3 text-sm">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="font-medium mb-2">Scenario 1: First Time Using Autobid</p>
                  <p className="text-muted-foreground mb-1">You set max bid to $100 (current bid is $2)</p>
                  <p className="text-xs text-muted-foreground">✅ System immediately bids $2 for you + protects you up to $100</p>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="font-medium mb-2">Scenario 2: You're Winning, Increase Max Bid</p>
                  <p className="text-muted-foreground mb-1">You're winning at $50, update max from $100 to $150</p>
                  <p className="text-xs text-muted-foreground">✅ No new bid placed - just updates your max protection to $150</p>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <p className="font-medium mb-2">Scenario 3: You're Losing, Increase Max Bid</p>
                  <p className="text-muted-foreground mb-1">Someone bid $120 (you lose), you update max to $200</p>
                  <p className="text-xs text-muted-foreground">✅ System immediately bids $125 to reclaim lead + protects up to $200</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-4">
              <p className="text-sm font-medium mb-2">💡 Smart Bidding Tips:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• You cannot bid against yourself - if you're winning, bid buttons are disabled</li>
                <li>• When autobid is active, the system only bids the minimum needed to keep you in the lead</li>
                <li>• If someone exceeds your max, you'll get a notification to increase your limit</li>
                <li>• You can update your max bid anytime before the auction ends</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: "Winning an Auction",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">When the auction ends and you're the highest bidder:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>You'll see a celebration message confirming you won</li>
              <li>The item is automatically added to your orders</li>
              <li>Your payment method is charged for the final bid amount plus shipping</li>
              <li>You'll receive an email confirmation with order details</li>
              <li>Track your order in "My Orders" just like any other purchase</li>
            </ul>
          </div>
        )
      },
      {
        title: "Proof-of-Purchase Video Recording",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">For your protection, we automatically capture video evidence of every auction win:</p>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h5 className="font-semibold mb-2 flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                How It Works
              </h5>
              <p className="text-sm text-muted-foreground mb-3">
                When an auction ends with a winner, our system automatically captures the <strong>last 5-10 seconds</strong> of the live stream before the winning bid. This video clip is permanently attached to your order as proof of what you won.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Protection for Buyers</p>
                  <p className="text-sm text-muted-foreground">The video shows exactly what was displayed when you won - including the item's condition and the seller's description. If what arrives doesn't match what was shown, you have proof.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Protection for Sellers</p>
                  <p className="text-sm text-muted-foreground">Sellers are protected too - the video proves exactly what was shown and promised during the auction. It prevents false claims about item condition or description.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Always Accessible</p>
                  <p className="text-sm text-muted-foreground">Both buyers and sellers can view the proof-of-purchase video anytime in the order details. It's there whenever you need it for reference or dispute resolution.</p>
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mt-4">
              <p className="text-sm font-medium mb-2">✨ Why This Matters:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Creates trust and transparency in every transaction</li>
                <li>• Eliminates "he said, she said" disputes</li>
                <li>• Provides peace of mind for high-value purchases</li>
                <li>• Makes returns and refunds fair for everyone</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: "giveaways",
    title: "Free Giveaways",
    icon: Gift,
    description: "Entering and winning free items",
    content: [
      {
        title: "What are Giveaways?",
        body: "Giveaways are completely free prizes that sellers offer during their live shows. You can enter for a chance to win without purchasing anything. It's a fun way to get free products and adds excitement to watching shows. Many sellers host giveaways to thank their followers and attract new viewers."
      },
      {
        title: "How to Enter a Giveaway",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">Entering is simple and free:</p>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span><strong>Watch the Live Show:</strong> Giveaways only happen during live shows, so join a stream</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span><strong>Wait for Announcement:</strong> The seller will announce when a giveaway starts</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span><strong>Click "Enter Giveaway":</strong> A button will appear - click it to enter</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span><strong>Watch the Countdown:</strong> Giveaway entries close after 5 minutes</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <span><strong>Winner Announced:</strong> One lucky person is randomly selected and announced live</span>
              </li>
            </ol>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mt-4">
              <p className="text-sm font-medium mb-2">✨ Giveaway Tips:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Enter quickly - you have 5 minutes before entries close</li>
                <li>• One entry per person per giveaway</li>
                <li>• Stay in the show to see if you won</li>
                <li>• Follow sellers who frequently host giveaways</li>
                <li>• Turn on notifications for your favorite sellers</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: "If You Win",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Congratulations! Here's what happens:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>You'll see a celebration animation on screen</li>
              <li>The seller announces your name in the show chat</li>
              <li>The product is automatically added to your orders</li>
              <li>Shipping is completely free - no charges at all</li>
              <li>You'll receive the item just like any other order</li>
              <li>No need to do anything else - just wait for delivery!</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: "live-shows",
    title: "Live Shows & Chat",
    icon: Video,
    description: "Watching and interacting",
    content: [
      {
        title: "Finding Shows to Watch",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Discover shows that match your interests:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Homepage Feed:</strong> Scroll through live and upcoming shows on the main page</li>
              <li><strong>Category Tabs:</strong> Filter by Fashion, Electronics, Beauty, Home & Garden, Sports, Toys, and more</li>
              <li><strong>Search Bar:</strong> Search for specific products, brands, or seller names</li>
              <li><strong>Trending Page:</strong> See the most popular shows with the most viewers</li>
              <li><strong>Following Tab:</strong> Quick access to shows from sellers you follow</li>
              <li><strong>Scheduled Shows:</strong> See upcoming shows and set reminders</li>
            </ul>
          </div>
        )
      },
      {
        title: "During the Show",
        body: (
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold mb-2">Interacting with Chat</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>Send messages that all viewers can see</li>
                <li>Ask questions about products</li>
                <li>Chat with other viewers</li>
                <li>Use emojis and reactions</li>
                <li>See who else is watching</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2">Viewing Products</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>The seller "pins" products they're currently showing</li>
                <li>Pinned products appear in a sidebar or overlay</li>
                <li>Click any product to see full details</li>
                <li>Add to cart or buy instantly without leaving the show</li>
                <li>See prices, descriptions, and images</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-2">Participating in Activities</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>Join auctions when the seller starts bidding</li>
                <li>Enter giveaways for free prizes</li>
                <li>Vote in polls and answer trivia</li>
                <li>React with emojis to show excitement</li>
                <li>Follow the seller to get notified of future shows</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: "Private Messaging",
        body: "Want to ask the seller a private question? Use the direct message feature to chat one-on-one with sellers. This is perfect for asking about custom orders, shipping details, or anything you don't want to share in the public chat. Sellers typically respond within a few hours."
      }
    ]
  },
  {
    id: "payments-shipping",
    title: "Payments & Shipping",
    icon: CreditCard,
    description: "Checkout and delivery",
    content: [
      {
        title: "Accepted Payment Methods",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">We accept all major credit and debit cards:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border rounded-lg p-3 text-center">
                <p className="font-medium text-sm">Visa</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="font-medium text-sm">Mastercard</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="font-medium text-sm">American Express</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="font-medium text-sm">Discover</p>
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-sm font-medium mb-1">🔒 Your payment information is secure</p>
              <p className="text-sm text-muted-foreground">We use industry-standard encryption to protect your card details. Your information is never shared with sellers.</p>
            </div>
          </div>
        )
      },
      {
        title: "How to Add a Payment Method",
        body: (
          <div className="space-y-3">
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span>Go to your profile by clicking your photo in the top right</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span>Click on "Payment Methods"</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span>Click "Add Payment Method"</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span>Enter your card number, expiration date, and security code</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <span>Save the card for future purchases</span>
              </li>
            </ol>
            <p className="text-sm text-muted-foreground italic">You can save multiple cards and choose which one to use at checkout.</p>
          </div>
        )
      },
      {
        title: "Shipping Information",
        body: (
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold mb-2">Delivery Times</h5>
              <p className="text-sm text-muted-foreground mb-2">Shipping times vary by seller and location:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>Standard shipping: 5-7 business days</li>
                <li>Expedited shipping: 2-3 business days (if offered)</li>
                <li>International orders: 10-20 business days</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">Exact shipping costs and times are shown during checkout before you purchase.</p>
            </div>
            <div>
              <h5 className="font-semibold mb-2">Tracking Your Order</h5>
              <ol className="space-y-2 text-sm text-muted-foreground ml-4">
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                  <span>Go to "My Orders" in your profile</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                  <span>Find your order and click "Track Package"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                  <span>See real-time updates as your package moves</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                  <span>Get email notifications when it ships and delivers</span>
                </li>
              </ol>
            </div>
          </div>
        )
      },
      {
        title: "Returns & Refunds",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Not satisfied with your purchase? Here's how returns work:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Most sellers accept returns within 30 days of delivery</li>
              <li>Items must be unused and in original packaging</li>
              <li>Contact the seller through "My Orders" to request a return</li>
              <li>The seller will provide return instructions</li>
              <li>Refunds are processed within 5-7 business days after the seller receives the return</li>
              <li>Money is returned to your original payment method</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3"><strong>Note:</strong> Return policies may vary by seller. Check the product page for specific details before purchasing.</p>
          </div>
        )
      }
    ]
  },
  {
    id: "deals-discovery",
    title: "Deals & Discovery",
    icon: TrendingUp,
    description: "Finding the best deals and trending items",
    content: [
      {
        title: "The Deals Page",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">The Deals page is your shortcut to the best value on the platform:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Trending Products:</strong> Items that are selling fast or getting lots of attention right now</li>
              <li><strong>Trending Auctions:</strong> Live and upcoming auctions with the most bidding activity</li>
              <li><strong>Flash Deals:</strong> Time-limited price drops available only for a short window</li>
              <li><strong>Featured Shows:</strong> Shows hand-picked by the platform for their quality or unique products</li>
            </ul>
          </div>
        )
      },
      {
        title: "Trending Auctions",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">The Trending Auctions page shows you the most competitive and exciting active auctions:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Sorted by bid activity, viewer count, and time remaining</li>
              <li>See the current highest bid and how many people are competing</li>
              <li>Jump straight into bidding from the listing</li>
              <li>Items nearing their end time are highlighted so you don't miss out</li>
            </ul>
          </div>
        )
      },
      {
        title: "Trending Products",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Browse products that are popular right now across all shows:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Items with the highest recent sales and views</li>
              <li>Filter by category to find trending items in your area of interest</li>
              <li>Buy directly from the listing without needing to join a live show</li>
              <li>Updated frequently so the list stays current</li>
            </ul>
          </div>
        )
      },
      {
        title: "Featured Shows",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Featured shows are promoted by the platform team:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Curated picks for high-quality content and great products</li>
              <li>Great way to discover new sellers you might love</li>
              <li>Both live and scheduled upcoming shows are featured</li>
              <li>Set a reminder for upcoming featured shows so you don't miss them</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: "disputes",
    title: "Disputes & Buyer Protection",
    icon: Shield,
    description: "Resolving order problems and getting your money back",
    content: [
      {
        title: "When to Open a Dispute",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">You can open a dispute if something goes wrong with your order:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Item not received:</strong> Your order shows as delivered but you never got it</li>
              <li><strong>Item not as described:</strong> What arrived is significantly different from what was shown in the show</li>
              <li><strong>Damaged on arrival:</strong> The item arrived broken or damaged due to poor packaging</li>
              <li><strong>Wrong item sent:</strong> You received something different from what you ordered</li>
              <li><strong>Seller not responding:</strong> You've tried to contact the seller and haven't heard back within a reasonable time</li>
            </ul>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-2">
              <p className="text-sm font-medium mb-1">💡 Try the seller first</p>
              <p className="text-sm text-muted-foreground">Before opening a dispute, always try messaging the seller directly. Most issues are resolved quickly this way without needing the formal dispute process.</p>
            </div>
          </div>
        )
      },
      {
        title: "How to Open a Dispute",
        body: (
          <div className="space-y-3">
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span>Go to <strong>My Orders</strong> and find the affected order</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span>Click <strong>Open Dispute</strong> on the order detail page</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span>Select the reason that best describes your problem</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span>Provide a description and any photos or evidence you have</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <span>Submit — the seller and our support team are notified immediately</span>
              </li>
            </ol>
          </div>
        )
      },
      {
        title: "What Happens After You File",
        body: (
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h5 className="font-semibold mb-1">Seller responds</h5>
              <p className="text-sm text-muted-foreground">The seller is given a chance to respond to your claim. They may offer a replacement, refund, or provide tracking evidence showing the item was delivered.</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <h5 className="font-semibold mb-1">Admin review</h5>
              <p className="text-sm text-muted-foreground">If the dispute isn't resolved between you and the seller, our admin team steps in to review both sides and make a decision. The proof-of-purchase video from the auction (if applicable) may be used as evidence.</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h5 className="font-semibold mb-1">Resolution</h5>
              <p className="text-sm text-muted-foreground">Once resolved, the outcome — whether a refund, replacement, or case closed — is applied. You'll receive an email notification with the final decision.</p>
            </div>
          </div>
        )
      },
      {
        title: "For Sellers: Responding to Disputes",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">When a buyer opens a dispute on one of your orders:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>You'll receive an email and in-app notification immediately</li>
              <li>Go to your <strong>Orders</strong> page and find the disputed order — it will be flagged</li>
              <li>Respond promptly with your side of the situation</li>
              <li>Provide tracking information, photos, or any other evidence that supports your case</li>
              <li>The proof-of-purchase video attached to auction orders is available to both parties</li>
            </ul>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2">
              <p className="text-sm font-medium mb-1">⚠️ Respond quickly</p>
              <p className="text-sm text-muted-foreground">Failing to respond to a dispute in a timely manner may result in an automatic ruling in the buyer's favour. Check your notifications regularly.</p>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: "referral-program",
    title: "Referral Program",
    icon: Zap,
    description: "Earn credits by inviting friends",
    content: [
      {
        title: "How the Referral Program Works",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Earn credits when you invite friends to join the platform:</p>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span>Find your unique referral link or code in your profile settings</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span>Share it with friends via message, social media, or email</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span>When your friend signs up using your link and makes their first purchase, you both earn a credit</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span>Credits are applied to your account automatically and can be used on future purchases</span>
              </li>
            </ol>
          </div>
        )
      },
      {
        title: "Referral Credit Limits",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">There are limits in place to keep the program fair:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Each account can earn up to a maximum referral credit limit per referral cycle</li>
              <li>Credits are only awarded once per referred user (not per purchase they make)</li>
              <li>Self-referrals are not permitted</li>
              <li>Referral credits cannot be withdrawn as cash — they apply to purchases only</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">Check your profile for the current credit amount and your referral history.</p>
          </div>
        )
      }
    ]
  },
  {
    id: "becoming-seller",
    title: "Becoming a Seller",
    icon: Users,
    description: `Start selling on ${appName}`,
    content: [
      {
        title: "Who Can Become a Seller?",
        body: `Anyone with products to sell can apply to become a seller on ${appName}! Whether you're a small business owner, artist, craftsperson, reseller, or just someone with things to sell, we welcome you. You'll need to be approved by our team before you can start hosting shows, but the application process is straightforward.`
      },
      {
        title: "How to Apply",
        body: (
          <div className="space-y-4">
            <ol className="space-y-3 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <div className="space-y-1">
                  <p><strong>Create an Account</strong></p>
                  <p className="text-xs">Sign up as a regular user first if you haven't already</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <div className="space-y-1">
                  <p><strong>Go to "Become a Seller"</strong></p>
                  <p className="text-xs">Find this option in your profile menu</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <div className="space-y-1">
                  <p><strong>Fill Out Application</strong></p>
                  <p className="text-xs">Provide business information (if applicable), contact details, and describe what you plan to sell</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <div className="space-y-1">
                  <p><strong>Wait for Approval</strong></p>
                  <p className="text-xs">Our team reviews applications within 1-3 business days</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <div className="space-y-1">
                  <p><strong>Set Up Your Store</strong></p>
                  <p className="text-xs">Once approved, add products and schedule your first show!</p>
                </div>
              </li>
            </ol>
          </div>
        )
      },
      {
        title: "What You Can Do as a Seller",
        body: (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold text-sm mb-2">On Mobile & Web:</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Host live video shows</li>
                    <li>• Add products on the go</li>
                    <li>• Start quick auctions during shows</li>
                    <li>• Run 5-minute giveaways</li>
                    <li>• Chat with viewers</li>
                    <li>• Pin products during streams</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold text-sm mb-2">Web Only (Seller Hub):</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Create long-term featured auctions</li>
                    <li>• Bulk upload many products at once</li>
                    <li>• View detailed sales analytics</li>
                    <li>• Schedule shows in advance</li>
                    <li>• Manage all orders</li>
                    <li>• Set up shipping profiles</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Hosting Your First Live Show",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">Ready to go live? Here's a simple guide:</p>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span><strong>Prepare Your Products:</strong> Have items ready to show on camera</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span><strong>Choose Good Lighting:</strong> Make sure viewers can see products clearly</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span><strong>Start Your Show:</strong> Click "Go Live" and select a category</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span><strong>Welcome Viewers:</strong> Greet people as they join your show</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <span><strong>Demonstrate Products:</strong> Show items on camera, explain features, answer questions</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">6.</span>
                <span><strong>Pin Products:</strong> Make items available for purchase during the show</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">7.</span>
                <span><strong>Run Auctions/Giveaways:</strong> Create excitement with special offers</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">8.</span>
                <span><strong>End Gracefully:</strong> Thank viewers and announce your next show</span>
              </li>
            </ol>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
              <p className="text-sm font-medium mb-2">💡 Tips for Success:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Be energetic and enthusiastic</li>
                <li>• Respond to chat messages quickly</li>
                <li>• Demonstrate products thoroughly</li>
                <li>• Host shows regularly to build an audience</li>
                <li>• Offer special deals to your live viewers</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: "Seller Fees",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Understanding what you'll pay:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Commission:</strong> A small percentage of each sale goes to {appName} (typically 6-10%)</li>
              <li><strong>Payment Processing:</strong> Standard credit card processing fees apply</li>
              <li><strong>No Listing Fees:</strong> It's free to add products to your store</li>
              <li><strong>No Monthly Fees:</strong> You only pay when you make sales</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">Exact commission rates are shown in your seller dashboard. You'll see a breakdown of fees for each sale.</p>
          </div>
        )
      },
      {
        title: "Getting Paid",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">How seller payouts work:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Add your bank account information in seller settings</li>
              <li>Funds from sales are held for 2-3 days after delivery</li>
              <li>Payouts are sent to your bank account weekly</li>
              <li>View all transactions in your seller dashboard</li>
              <li>Track pending and completed payouts</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: "categories-products",
    title: "Categories & Product Rules",
    icon: Layout,
    description: "How products are organised and what can be sold",
    content: [
      {
        title: "How Categories Work",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Every product on the platform belongs to a category and optionally a subcategory. Categories make it easier for buyers to find what they're looking for and help the platform surface relevant products during shows.</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Categories are managed by the platform — sellers choose from the available list</li>
              <li>Each category may have subcategories for more precise organisation (e.g. <em>Fashion → Women's Clothing</em>)</li>
              <li>Buyers can browse and filter shows and products by category</li>
              <li>Choosing the right category improves your product's visibility in search and discovery pages</li>
            </ul>
          </div>
        )
      },
      {
        title: "Choosing the Right Category",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">When adding a product as a seller, pick the category that most accurately describes the item:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Be specific — use a subcategory when one is available and relevant</li>
              <li>Miscategorised products may be moved or removed by the admin team</li>
              <li>If none of the available categories fit your product, contact support to suggest a new one</li>
            </ul>
          </div>
        )
      },
      {
        title: "Prohibited Items",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">The following types of products are not permitted on the platform:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Weapons, firearms, or ammunition</li>
              <li>Illegal substances or drug paraphernalia</li>
              <li>Counterfeit or replica branded goods</li>
              <li>Adult content or sexually explicit material</li>
              <li>Items that infringe on copyright or intellectual property</li>
              <li>Recalled or unsafe products</li>
              <li>Hazardous materials</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">Listings that violate these rules will be removed and may result in account suspension. If you're unsure whether a product is permitted, contact support before listing it.</p>
          </div>
        )
      }
    ]
  },
  {
    id: "seller-features",
    title: "Seller Tools & Features",
    icon: BarChart3,
    description: "Managing your business",
    content: [
      {
        title: "Product Management",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Easily add and organize your inventory:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Add Products:</strong> Upload photos, write descriptions, set prices</li>
              <li><strong>Organize with Categories:</strong> Help buyers find your products</li>
              <li><strong>Track Inventory:</strong> System automatically updates stock levels</li>
              <li><strong>Create Variants:</strong> Offer different sizes, colors, or options</li>
              <li><strong>Bulk Upload:</strong> Add many products at once using spreadsheet (web only)</li>
              <li><strong>Edit Anytime:</strong> Update prices, descriptions, and photos easily</li>
            </ul>
          </div>
        )
      },
      {
        title: "Creating Featured Auctions",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Set up long-term auctions (web only):</p>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span>Go to your Seller Hub on the website</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span>Click "Create Featured Auction"</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span>Select a product or create a new one</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span>Set the starting bid price</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <span>Choose start and end dates/times</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">6.</span>
                <span>Submit and your auction will appear on the homepage</span>
              </li>
            </ol>
            <p className="text-sm text-muted-foreground italic mt-3">Featured auctions get prominent placement on the homepage, perfect for high-value items!</p>
          </div>
        )
      },
      {
        title: "Sales Analytics",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Track your performance (web only):</p>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="border rounded-lg p-3">
                <DollarSign className="h-6 w-6 text-primary mb-2" />
                <p className="font-semibold text-sm">Revenue Reports</p>
                <p className="text-xs text-muted-foreground mt-1">See total sales, average order value, and trends over time</p>
              </div>
              <div className="border rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-primary mb-2" />
                <p className="font-semibold text-sm">Top Products</p>
                <p className="text-xs text-muted-foreground mt-1">Identify which items sell best and generate most revenue</p>
              </div>
              <div className="border rounded-lg p-3">
                <Users className="h-6 w-6 text-primary mb-2" />
                <p className="font-semibold text-sm">Customer Insights</p>
                <p className="text-xs text-muted-foreground mt-1">Learn about your buyers and repeat customers</p>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Order Fulfillment",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Managing orders is straightforward:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Get Notified:</strong> Receive email and app notifications for new orders</li>
              <li><strong>View Order Details:</strong> See what was ordered, shipping address, and customer notes</li>
              <li><strong>Print Shipping Labels:</strong> Generate labels directly in the system</li>
              <li><strong>Mark as Shipped:</strong> Update order status and add tracking number</li>
              <li><strong>Customer Communication:</strong> Message buyers if you have questions</li>
              <li><strong>Track History:</strong> View all past orders and their status</li>
            </ul>
          </div>
        )
      },
      {
        title: "Advanced Shipping Management",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">{appName} offers powerful shipping tools to streamline your fulfillment process:</p>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h5 className="font-semibold mb-2 flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" />
                Bulk Label Printing
              </h5>
              <p className="text-sm text-muted-foreground mb-2">
                Print shipping labels for multiple orders at once instead of creating them one by one. This is a huge time-saver during busy periods!
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>How it works:</strong></p>
                <ol className="space-y-1 ml-4">
                  <li>1. Go to the Shipping Management page</li>
                  <li>2. Select multiple orders using checkboxes</li>
                  <li>3. Click "Bulk Label" button</li>
                  <li>4. All labels are generated and downloaded as a single PDF</li>
                  <li>5. Print them all at once and attach to packages</li>
                </ol>
                <p className="text-xs italic mt-2">💡 Tip: Filter by show or date to process all orders from a specific event together.</p>
              </div>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h5 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                USPS SCAN Forms
              </h5>
              <p className="text-sm text-muted-foreground mb-2">
                Save time at the post office by creating a USPS SCAN form - one barcode that represents all your packages. No need to scan each package individually!
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Benefits:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Drop off multiple packages with just one scan</li>
                  <li>Faster processing at USPS facilities</li>
                  <li>Immediate acceptance tracking for all packages</li>
                  <li>Professional appearance for your business</li>
                </ul>
                <p className="mt-2"><strong>How to use:</strong></p>
                <ol className="space-y-1 ml-4">
                  <li>1. Create shipping labels for your orders first</li>
                  <li>2. Go to Shipping Management and filter by "Marketplace" or specific show</li>
                  <li>3. Click "Generate SCAN Form"</li>
                  <li>4. Print the form and bring it with your packages to USPS</li>
                  <li>5. Hand the form to the postal worker - they'll scan just this one sheet!</li>
                </ol>
                <p className="text-xs italic mt-2">💡 You can view and reprint previous SCAN forms anytime using the "View SCAN Form" button.</p>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h5 className="font-semibold mb-2 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Bundling Shipments
              </h5>
              <p className="text-sm text-muted-foreground mb-2">
                Combine multiple orders going to the same buyer into one package to save on shipping costs.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>When to bundle:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Same buyer purchased multiple items from you</li>
                  <li>All items are ready to ship at the same time</li>
                  <li>Items can physically fit in one box together</li>
                  <li>Shipping destination is the same for all orders</li>
                </ul>
                <p className="mt-2"><strong>How to bundle:</strong></p>
                <ol className="space-y-1 ml-4">
                  <li>1. The system automatically detects orders that can be bundled together</li>
                  <li>2. You'll see suggested bundles in the Shipping Management page</li>
                  <li>3. Review the items and confirm the bundle</li>
                  <li>4. Create one shipping label for the combined package</li>
                  <li>5. Pack all items together and ship as one</li>
                </ol>
                <p className="text-xs italic mt-2">💡 Bundling saves you money on shipping and provides better service to your customers!</p>
              </div>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h5 className="font-semibold mb-2 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Unbundling Shipments
              </h5>
              <p className="text-sm text-muted-foreground mb-2">
                Need to split a previously bundled shipment? Sometimes you realize items should be shipped separately after bundling them.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Why unbundle:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>One item is out of stock or damaged</li>
                  <li>Items are too large to fit in one box</li>
                  <li>Customer requested separate shipment</li>
                  <li>Different shipping speeds needed</li>
                </ul>
                <p className="mt-2"><strong>How to unbundle:</strong></p>
                <ol className="space-y-1 ml-4">
                  <li>1. Find the bundled order in Shipping Management</li>
                  <li>2. Click the unbundle button (unlink icon)</li>
                  <li>3. Select which items to remove from the bundle</li>
                  <li>4. The items will become separate shipments</li>
                  <li>5. Create individual labels for each shipment</li>
                </ol>
                <p className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-xs mt-2">
                  <strong>⚠️ Important:</strong> If you've already created a label for the bundle, you may need to void it and create new labels after unbundling.
                </p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
              <h5 className="font-semibold mb-2">📦 Complete Shipping Workflow</h5>
              <p className="text-sm text-muted-foreground mb-3">Here's the recommended process for managing your shipments:</p>
              <ol className="text-sm text-muted-foreground space-y-2 ml-4">
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                  <span><strong>Review Orders:</strong> Check your unfulfilled orders and bundle any that can be combined</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                  <span><strong>Create Labels:</strong> Use bulk label printing to generate all labels at once</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                  <span><strong>Generate SCAN Form:</strong> Create one form for all your USPS packages</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                  <span><strong>Pack and Ship:</strong> Attach labels and drop everything off at USPS with your SCAN form</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                  <span><strong>Track Progress:</strong> Monitor delivery status and handle any issues that arise</span>
                </li>
              </ol>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: "seller-payouts",
    title: "Seller Payouts & How You Get Paid",
    icon: DollarSign,
    description: "Understanding the payment flow from sale to withdrawal",
    content: [
      {
        title: "Overview: How Money Flows",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">When a buyer purchases from you, the money doesn't go directly to your bank account. Here's the full journey it takes before you can withdraw:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="min-w-[28px] h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">1</div>
                <div>
                  <p className="font-medium">Buyer pays → Platform account</p>
                  <p className="text-sm text-muted-foreground">All payments go into the platform's Stripe account first. The money is held there, not in your account yet.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[28px] h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">2</div>
                <div>
                  <p className="font-medium">Stripe holds the funds</p>
                  <p className="text-sm text-muted-foreground">Stripe applies a standard holding period (typically a few business days) before funds become available. This is a fraud and chargeback protection measure applied to all transactions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[28px] h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">3</div>
                <div>
                  <p className="font-medium">You ship the order</p>
                  <p className="text-sm text-muted-foreground">You must ship the order and have it scanned by the carrier (USPS via Shippo). The scan confirms the package has physically entered the postal system. Until the order is scanned and marked as shipped, payment cannot be released to you — even if Stripe's holding period has ended.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[28px] h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">4</div>
                <div>
                  <p className="font-medium">Money transfers to your Stripe account</p>
                  <p className="text-sm text-muted-foreground">Once both conditions are met — Stripe funds available and order scanned — the money moves to your connected Stripe account's available balance.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="min-w-[28px] h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">5</div>
                <div>
                  <p className="font-medium">Your wallet is credited</p>
                  <p className="text-sm text-muted-foreground">Your in-app wallet reflects the balance available in your connected Stripe account. From here you can request a withdrawal to your bank.</p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "The Two Payout Scenarios",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">Because Stripe's holding period and your shipping timeline don't always line up perfectly, there are two ways payout can happen:</p>

            <div className="border-l-4 border-green-500 pl-4">
              <h5 className="font-semibold mb-2 flex items-center gap-2">
                ✅ Automatic Payout (the normal path)
              </h5>
              <p className="text-sm text-muted-foreground mb-2">
                Stripe sends a webhook notification that the funds are available. The system checks whether your order has already been scanned and shipped. If it has, the transfer happens automatically — no action needed from you or the admin.
              </p>
              <p className="text-xs text-muted-foreground italic">This is the most common scenario when you ship promptly.</p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h5 className="font-semibold mb-2 flex items-center gap-2">
                ⏳ Manual Payout (timing mismatch)
              </h5>
              <p className="text-sm text-muted-foreground mb-2">
                Sometimes Stripe's holding period ends before the order has been scanned by the carrier. In this case, the system cannot automatically release the funds. The transaction is placed in a <strong>Pending</strong> queue for the admin.
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Once you ship and the carrier scans the package (marking the order as shipped), the admin will see the transaction appear in the <strong>Pending tab</strong> of the Payouts page and manually trigger the transfer to your Stripe account.
              </p>
              <p className="text-xs text-muted-foreground italic">Your wallet will be credited and you'll be able to withdraw once the admin completes the manual transfer.</p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-2">
              <p className="text-sm font-medium mb-1">💡 How to avoid delays</p>
              <p className="text-sm text-muted-foreground">Ship your orders quickly and make sure the carrier scans the package when you drop it off. Using Shippo's label printing through the app ensures the scan is automatically detected and your order status is updated instantly.</p>
            </div>
          </div>
        )
      },
      {
        title: "Your In-App Wallet",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Your wallet in the app tracks the balance that is available in your connected Stripe account:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>The wallet balance reflects funds that have been successfully transferred to your Stripe connected account</li>
              <li>It is updated automatically when an automatic transfer completes, or when an admin processes a manual transfer</li>
              <li>You can request a withdrawal from your wallet to your bank account at any time</li>
              <li>The wallet does not hold money itself — it is a live record of what's sitting in your Stripe available balance</li>
            </ul>
          </div>
        )
      },
      {
        title: "Platform Commission & Fees",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Before funds are transferred to your account, the platform deducts its commission:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>A percentage commission is applied to each sale — the exact rate is set by the platform admin and visible in your seller dashboard</li>
              <li>Stripe's own processing fees are also deducted as part of the transaction</li>
              <li>What reaches your wallet is the sale amount minus commission and processing fees</li>
              <li>You can view a full breakdown of fees on any transaction in your payout history</li>
            </ul>
          </div>
        )
      },
      {
        title: "Connecting Your Stripe Account",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">To receive payouts you must connect a Stripe account:</p>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span>Go to your seller profile and find the <strong>Payouts</strong> or <strong>Stripe Connect</strong> section</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span>Click <strong>Connect Stripe Account</strong> — you'll be redirected to Stripe's secure onboarding</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span>Complete Stripe's identity and bank account verification</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span>Once verified, your account is linked and future payouts will flow to it automatically</span>
              </li>
            </ol>
            <p className="text-sm text-muted-foreground mt-2">You cannot receive payouts without a verified connected Stripe account. Sales will still be recorded, and funds will transfer as soon as your account is connected and verified.</p>
          </div>
        )
      }
    ]
  },
  {
    id: "seller-analytics",
    title: "Seller Analytics & Dashboard",
    icon: BarChart3,
    description: "Understanding your performance and sales data",
    content: [
      {
        title: "Your Seller Dashboard",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Your seller dashboard gives you a real-time overview of your business performance:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Total Sales:</strong> Cumulative revenue across all shows and products</li>
              <li><strong>Orders:</strong> Count of all orders including pending, shipped, and completed</li>
              <li><strong>Pending Payouts:</strong> Funds that are in transit but not yet in your wallet</li>
              <li><strong>Wallet Balance:</strong> What's available for withdrawal right now</li>
              <li><strong>Active Products:</strong> How many products you currently have listed</li>
            </ul>
          </div>
        )
      },
      {
        title: "Show Analytics",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">After each show, you can review detailed analytics to understand how it performed:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Peak Viewers:</strong> The highest number of simultaneous viewers during the show</li>
              <li><strong>Total Sales:</strong> Revenue generated directly during the show</li>
              <li><strong>Items Sold:</strong> Number of individual products purchased</li>
              <li><strong>Giveaways Hosted:</strong> How many giveaways ran and who won</li>
              <li><strong>Shipments Created:</strong> Orders that are ready to be shipped</li>
              <li><strong>Tips Received:</strong> Total tips sent by viewers during the show</li>
              <li><strong>New Followers:</strong> Viewers who followed you during or after the show</li>
            </ul>
          </div>
        )
      },
      {
        title: "Using Analytics to Improve",
        body: (
          <div className="space-y-3">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Compare viewer count across shows to see which time slots attract more people</li>
              <li>Track which products sell best during shows vs. through browsing</li>
              <li>Monitor your follower growth to measure whether your audience is expanding</li>
              <li>Review shows with high tips — this usually signals strong audience engagement</li>
              <li>Use the shipment data to spot shows where order volume spikes, so you can prepare packaging in advance</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: "seller-shipping-profiles",
    title: "Shipping Profiles",
    icon: Truck,
    description: "Setting up reusable shipping rates for your products",
    content: [
      {
        title: "What are Shipping Profiles?",
        body: "Shipping profiles are reusable shipping rate templates you create once and then apply to multiple products. Instead of entering shipping costs for every individual product, you define a profile (e.g. \"Small Parcel - Standard\") with your rates and assign it to all products that match those shipping requirements."
      },
      {
        title: "Creating a Shipping Profile",
        body: (
          <div className="space-y-3">
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span>Go to <strong>Shipping Profiles</strong> in your seller tools</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span>Click <strong>Create Profile</strong> and give it a descriptive name</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span>Set your shipping rates — flat rate, weight-based, or free shipping</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span>Add any handling time or shipping zone restrictions</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <span>Save the profile and assign it to your products</span>
              </li>
            </ol>
          </div>
        )
      },
      {
        title: "Why Use Shipping Profiles?",
        body: (
          <div className="space-y-3">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Save time — set rates once and apply them to dozens of products</li>
              <li>Stay consistent — buyers see the same shipping cost for similar items</li>
              <li>Easy to update — change the rate in one profile and it updates across all assigned products instantly</li>
              <li>Useful for separating heavy vs. light items, or domestic vs. international shipping</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: "notifications",
    title: "Notifications & Reminders",
    icon: Clock,
    description: "Staying up to date with shows, orders, and activity",
    content: [
      {
        title: "Types of Notifications",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">The platform sends notifications through multiple channels:</p>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-sm mb-1">Email Notifications</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  <li>Order confirmations and shipping updates</li>
                  <li>Auction win/loss notifications</li>
                  <li>Payout transfers and wallet credits</li>
                  <li>Dispute status updates</li>
                  <li>Seller approval decisions</li>
                  <li>New messages from sellers or buyers</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-sm mb-1">Push Notifications (Mobile App)</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  <li>Show reminders — get notified when a seller you follow goes live</li>
                  <li>Outbid alerts — instant notification when someone beats your bid</li>
                  <li>Giveaway results</li>
                  <li>New order placed (for sellers)</li>
                  <li>Order shipped confirmation (for buyers)</li>
                </ul>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Show Reminders",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Never miss a show from a seller you love:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Follow a seller</strong> to automatically receive notifications when they go live</li>
              <li>On scheduled upcoming shows, click <strong>Remind Me</strong> to get a notification shortly before it starts</li>
              <li>Reminders are sent via push notification on mobile and as an in-app alert on web</li>
            </ul>
          </div>
        )
      },
      {
        title: "Managing Your Notification Preferences",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">You can control which notifications you receive:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Go to your <strong>Profile → Settings → Notifications</strong></li>
              <li>Toggle individual notification types on or off</li>
              <li>Email notifications for important account events (orders, payouts, disputes) cannot be disabled as they are required for account operation</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: "safety-support",
    title: "Safety & Support",
    icon: Shield,
    description: "Staying safe and getting help",
    content: [
      {
        title: "Your Safety is Important",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">We're committed to keeping you safe:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Secure Payments:</strong> All transactions are encrypted and processed through secure payment providers</li>
              <li><strong>Privacy Protection:</strong> Your personal information is never shared with sellers without your permission</li>
              <li><strong>Buyer Protection:</strong> Report issues with orders and we'll help resolve them</li>
              <li><strong>Content Moderation:</strong> Our team monitors shows and products for inappropriate content</li>
              <li><strong>User Reporting:</strong> Report sellers, products, or chat messages that violate our policies</li>
            </ul>
          </div>
        )
      },
      {
        title: "How to Report a Problem",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">If you see something concerning:</p>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span>Click the "Report" button on the show, product, or message</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span>Select the reason for reporting (scam, inappropriate content, etc.)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span>Provide any additional details that might help</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span>Submit the report - our team will review it promptly</span>
              </li>
            </ol>
            <p className="text-sm text-muted-foreground mt-3">Reports are confidential and help us maintain a safe community.</p>
          </div>
        )
      },
      {
        title: "Getting Help",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Need assistance? We're here to help:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Help Center:</strong> Browse FAQs and guides for common questions</li>
              <li><strong>Contact Support:</strong> Email us through the Contact page</li>
              <li><strong>Live Chat:</strong> Chat with support during business hours (coming soon)</li>
              <li><strong>Seller Support:</strong> Special support channels for seller-specific questions</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">We typically respond to support requests within 24 hours.</p>
          </div>
        )
      }
    ]
  },
  {
    id: "age-restricted",
    title: "Age-Restricted Content",
    icon: Shield,
    description: "What age restrictions mean and how they work",
    content: [
      {
        title: "What is Age-Restricted Mode?",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">The platform may enable age restrictions when certain content or products require buyers to be of a minimum age. When this mode is active:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>You may be prompted to confirm your age before accessing certain shows or products</li>
              <li>Some content will not be visible until age is verified</li>
              <li>This applies to the entire platform when set by the admin, or to specific products and shows as designated by sellers</li>
            </ul>
          </div>
        )
      },
      {
        title: "Age Verification",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">If prompted to verify your age:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>You will be asked to confirm you meet the minimum age requirement</li>
              <li>This confirmation is stored against your account — you won't be asked again on the same device</li>
              <li>Providing a false age confirmation is a violation of the platform's terms of service</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">If you believe you've been incorrectly restricted from content, contact support through the Contact page.</p>
          </div>
        )
      }
    ]
  },
  {
    id: "tips-tricks",
    title: "Tips & Best Practices",
    icon: Star,
    description: `Getting the most from ${appName}`,
    content: [
      {
        title: "For Buyers",
        body: (
          <div className="space-y-3">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Follow Your Favorite Sellers:</strong> Get notified when they go live</li>
              <li><strong>Set Bid Limits:</strong> Use autobid to avoid overspending on auctions</li>
              <li><strong>Ask Questions:</strong> Don't hesitate to ask about products in chat</li>
              <li><strong>Watch Regularly:</strong> Many sellers offer special deals to loyal viewers</li>
              <li><strong>Enable Notifications:</strong> Never miss a show from sellers you love</li>
              <li><strong>Check Show Schedules:</strong> Plan ahead for shows you don't want to miss</li>
            </ul>
          </div>
        )
      },
      {
        title: "For Sellers",
        body: (
          <div className="space-y-3">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Be Consistent:</strong> Host shows on a regular schedule so viewers know when to tune in</li>
              <li><strong>Engage with Chat:</strong> Respond to viewer messages - it builds loyalty</li>
              <li><strong>Good Lighting Matters:</strong> Make sure products are clearly visible</li>
              <li><strong>Demonstrate Thoroughly:</strong> Show products from all angles, demonstrate features</li>
              <li><strong>Offer Variety:</strong> Mix regular products, auctions, and giveaways to keep shows exciting</li>
              <li><strong>Promote Your Shows:</strong> Share your show schedule on social media</li>
              <li><strong>Price Competitively:</strong> Research similar products to set fair prices</li>
              <li><strong>Ship Quickly:</strong> Fast shipping leads to happy customers and good reviews</li>
            </ul>
          </div>
        )
      },
      {
        title: "Making the Most of Live Shows",
        body: (
          <div className="space-y-3">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Join Early:</strong> Get a good spot in chat and don't miss early deals</li>
              <li><strong>Stay Until the End:</strong> Best deals often come at the end of shows</li>
              <li><strong>Be Respectful:</strong> Treat sellers and other viewers with kindness</li>
              <li><strong>Have Fun:</strong> Live shows are entertainment - enjoy the experience!</li>
              <li><strong>Share Great Shows:</strong> Tell friends about sellers you love</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: "offers-system",
    title: "Making & Managing Offers",
    icon: DollarSign,
    description: "Negotiate prices directly with sellers",
    content: [
      {
        title: "What is the Offers System?",
        body: `The offers system lets buyers propose a lower price on a product instead of paying the full listed amount. Sellers can then accept, decline, or send back a counter-offer. It's a way to negotiate directly — similar to haggling at a market, but done in the app. Not all products accept offers; it depends on the seller enabling it for that listing.`
      },
      {
        title: "How to Make an Offer (Buyers)",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">When you see a product with an "Make Offer" button:</p>
            <ol className="space-y-2 text-sm text-muted-foreground ml-4">
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">1.</span>
                <span>Click <strong>Make Offer</strong> on the product page</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">2.</span>
                <span>Choose a preset discount (5%, 10%, 15%, or 20% off) or enter a custom price</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">3.</span>
                <span>Review your offer amount and click <strong>Submit Offer</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">4.</span>
                <span>The seller is notified and will accept, decline, or counter your offer</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-foreground min-w-[20px]">5.</span>
                <span>Track the status of your offer in <strong>My Offers</strong></span>
              </li>
            </ol>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-2">
              <p className="text-sm font-medium mb-1">💡 Tips for successful offers</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Be reasonable — very low offers are likely to be declined</li>
                <li>• The seller can see your offer history so be consistent</li>
                <li>• You can cancel an offer before the seller responds</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        title: "Responding to Offers (Sellers)",
        body: (
          <div className="space-y-4">
            <p className="text-muted-foreground">When a buyer makes an offer on one of your products, you have three options:</p>
            <div className="space-y-3">
              <div className="border-l-4 border-green-500 pl-4">
                <h5 className="font-semibold mb-1">Accept</h5>
                <p className="text-sm text-muted-foreground">Agree to the buyer's proposed price. The buyer is charged at the offer price and the order is created automatically.</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <h5 className="font-semibold mb-1">Decline</h5>
                <p className="text-sm text-muted-foreground">Reject the offer. The buyer is notified and can make a new offer or purchase at full price.</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h5 className="font-semibold mb-1">Counter Offer</h5>
                <p className="text-sm text-muted-foreground">Propose a different price — typically somewhere between the buyer's offer and your list price. The buyer then gets to accept or decline your counter.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Find all incoming offers in your <strong>Offers</strong> page under seller tools. You can filter by status (pending, accepted, declined) and search by product or buyer name.</p>
          </div>
        )
      },
      {
        title: "Counter Offers & Negotiation",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">When a seller sends a counter offer:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>You'll receive a notification with the seller's proposed price</li>
              <li>Go to <strong>My Offers</strong> to review the counter</li>
              <li><strong>Accept</strong> — you'll be charged at the counter price and the order is created</li>
              <li><strong>Decline</strong> — the offer ends; you can try a new offer or purchase at list price</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">There is one round of counter-offer — buyers cannot counter the counter. If you decline, the negotiation ends.</p>
          </div>
        )
      }
    ]
  },
  {
    id: "account-profile",
    title: "Account & Profile Management",
    icon: Users,
    description: "Managing your profile, security, and account settings",
    content: [
      {
        title: "Editing Your Profile",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Your profile is visible to other users. Keep it up to date:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Go to <strong>Profile</strong> from the navigation menu</li>
              <li>Update your display name, profile photo, and bio</li>
              <li>Your profile photo and name are visible to sellers and other buyers in show chats</li>
              <li>Sellers see your profile when you make offers or place orders</li>
            </ul>
          </div>
        )
      },
      {
        title: "Account Settings",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Access full account settings from the <strong>Account</strong> page in the navigation:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li><strong>Personal Information:</strong> Update name, email, and contact details</li>
              <li><strong>Security:</strong> Change password, manage login methods</li>
              <li><strong>Notifications:</strong> Control which emails and push notifications you receive</li>
              <li><strong>Privacy:</strong> Manage what others can see on your profile</li>
              <li><strong>Payment Methods:</strong> Add, update, or remove saved cards</li>
              <li><strong>Shipping Addresses:</strong> Manage your saved delivery addresses</li>
            </ul>
          </div>
        )
      },
      {
        title: "Resetting Your Password",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">If you forget your password or want to change it:</p>
            <div className="border-l-4 border-blue-500 pl-4 mb-3">
              <h5 className="font-semibold mb-1">Forgot your password?</h5>
              <ol className="space-y-1 text-sm text-muted-foreground">
                <li>1. Click <strong>Forgot Password</strong> on the login page</li>
                <li>2. Enter the email address on your account</li>
                <li>3. Check your email for a reset link (check spam if it doesn't arrive)</li>
                <li>4. Click the link and set a new password</li>
                <li>5. The reset link expires after 1 hour — request a new one if it expires</li>
              </ol>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h5 className="font-semibold mb-1">Already logged in?</h5>
              <p className="text-sm text-muted-foreground">Go to <strong>Account → Security</strong> to change your password without needing the reset flow.</p>
            </div>
          </div>
        )
      },
      {
        title: "Viewing Other Profiles",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">You can view any user's public profile:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Click on a seller's name in a show or product listing to view their public profile</li>
              <li>Seller profiles show their active products, past shows, and reviews</li>
              <li>From a profile you can follow the seller, browse their shop, and message them directly</li>
              <li>Buyer profiles show basic info only — other buyers cannot see your purchase history</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: "following-social",
    title: "Following & Social Features",
    icon: Users,
    description: "Building your community and connecting with others",
    content: [
      {
        title: "Following Sellers",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Following a seller is the best way to stay connected with them:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Click <strong>Follow</strong> on any seller's profile or during their live show</li>
              <li>You'll get a notification whenever they go live</li>
              <li>Their shows appear in your <strong>Following</strong> tab on the homepage</li>
              <li>Sellers can see their follower count — your support helps them grow</li>
            </ul>
          </div>
        )
      },
      {
        title: "Managing Who You Follow",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">The <strong>Following</strong> page shows everyone you currently follow:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Search through your following list to find a specific person</li>
              <li>See their follower count to gauge their popularity</li>
              <li>Send them a direct message from the following list</li>
              <li>Unfollow anyone by visiting their profile and clicking <strong>Unfollow</strong></li>
            </ul>
          </div>
        )
      },
      {
        title: "Direct Messaging",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Send private messages to sellers or other users you follow:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Use the message icon on a profile or from your following list</li>
              <li>Great for asking about custom orders, stock availability, or post-sale questions</li>
              <li>Sellers typically respond within a few hours</li>
              <li>Message history is stored so you can refer back to past conversations</li>
            </ul>
          </div>
        )
      },
      {
        title: "Seller Follower Count & Growth",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">For sellers, your follower count is an important metric:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>New followers gained during each show appear in your show analytics</li>
              <li>Higher follower counts mean more viewers automatically notified when you go live</li>
              <li>Engaging in chat and hosting giveaways are proven ways to grow your following</li>
              <li>Consistent show schedules help — followers know when to tune in</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: "help-center",
    title: "Help Center & Support Articles",
    icon: BookOpen,
    description: "Finding step-by-step guides and support articles",
    content: [
      {
        title: "Knowledge Base vs Help Center",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">The platform offers two different support resources:</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h5 className="font-semibold mb-2">Knowledge Base (this page)</h5>
                <p className="text-sm text-muted-foreground">A comprehensive reference covering all platform features. Good for understanding how things work in depth.</p>
              </div>
              <div className="border rounded-lg p-4">
                <h5 className="font-semibold mb-2">Help Center</h5>
                <p className="text-sm text-muted-foreground">Short, focused how-to articles on specific tasks. Good for step-by-step guidance on a particular action.</p>
              </div>
            </div>
          </div>
        )
      },
      {
        title: "Using the Help Center",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">Access the Help Center from the footer or the support menu:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Browse articles by category or use the search bar to find your topic</li>
              <li>Articles cover specific tasks like "How to create a shipping label" or "How to set up Stripe Connect"</li>
              <li>Each article is focused on one task with clear numbered steps</li>
            </ul>
          </div>
        )
      },
      {
        title: "Still Need Help?",
        body: (
          <div className="space-y-3">
            <p className="text-muted-foreground">If you can't find what you need in the Help Center or Knowledge Base:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>Use the <strong>Contact</strong> page to send a message to the support team</li>
              <li>Include as much detail as possible — order numbers, screenshots, and a clear description help us resolve issues faster</li>
              <li>The support team typically responds within 24 hours</li>
            </ul>
          </div>
        )
      }
    ]
  },
  {
    id: "faq",
    title: "Common Questions",
    icon: MessageSquare,
    description: "Quick answers to frequent questions",
    content: [
      {
        title: "Account & Profile",
        body: (
          <div className="space-y-3">
            <div>
              <p className="font-medium text-sm mb-1">Q: How do I change my password?</p>
              <p className="text-sm text-muted-foreground">A: Go to your profile, click "Settings," then "Security." You can reset your password there.</p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">Q: Can I use the same account on web and mobile?</p>
              <p className="text-sm text-muted-foreground">A: Yes! Your account works across all platforms. Just log in with the same email.</p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">Q: How do I delete my account?</p>
              <p className="text-sm text-muted-foreground">A: Contact support through the Contact page to request account deletion.</p>
            </div>
          </div>
        )
      },
      {
        title: "Shopping & Payments",
        body: (
          <div className="space-y-3">
            <div>
              <p className="font-medium text-sm mb-1">Q: When will I be charged for an auction I won?</p>
              <p className="text-sm text-muted-foreground">A: Immediately when the auction ends. The payment is processed automatically.</p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">Q: Can I cancel an order after placing it?</p>
              <p className="text-sm text-muted-foreground">A: Contact the seller as soon as possible. If it hasn't shipped yet, they may be able to cancel it.</p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">Q: What if I never receive my order?</p>
              <p className="text-sm text-muted-foreground">A: First contact the seller. If they don't respond or resolve the issue, contact our support team.</p>
            </div>
          </div>
        )
      },
      {
        title: "Selling",
        body: (
          <div className="space-y-3">
            <div>
              <p className="font-medium text-sm mb-1">Q: How long does seller approval take?</p>
              <p className="text-sm text-muted-foreground">A: Usually 1-3 business days. You'll receive an email when your application is reviewed.</p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">Q: Can I sell internationally?</p>
              <p className="text-sm text-muted-foreground">A: Yes, you can ship to any country you choose. Set your shipping zones in seller settings.</p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">Q: What types of products can't I sell?</p>
              <p className="text-sm text-muted-foreground">A: Prohibited items include weapons, illegal substances, counterfeit goods, and adult content. See our full policy in seller terms.</p>
            </div>
          </div>
        )
      }
    ]
  }
];
