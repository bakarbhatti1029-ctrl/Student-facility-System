const HostelOwner = require('../../models/hostelowner/Hostelowner');
const Hostelroom = require('../../models/hostelowner/Hostelroom');
const RoomBed = require('../../models/hostelowner/RoomBed');
const KitchenOwner = require('../../models/kitchenowner/Kitchenowner');
const Dish = require('../../models/kitchenowner/Dish');
const Review = require('../../models/student/Review');

// ─── Ratings Helper ─────────────────────────────────────────────────────────
// Pulls real average ratings from the Review collection for a batch of
// hostels/kitchens in one aggregate query, so listings can show the same
// star ratings students see on the actual detail pages.
async function getRatingsMap(targetType, ids) {
    if (!ids.length) return new Map();
    const rows = await Review.aggregate([
        { $match: { target_type: targetType, target_id: { $in: ids } } },
        { $group: { _id: '$target_id', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    return new Map(rows.map(r => [String(r._id), { avg: r.avg, count: r.count }]));
}

function ratingText(ratingsMap, id) {
    const r = ratingsMap.get(String(id));
    return r ? `Rating: ${r.avg.toFixed(1)}/5 (${r.count} review${r.count === 1 ? '' : 's'})` : 'No reviews yet';
}

// ─── Typo Tolerance ─────────────────────────────────────────────────────────
// Students type fast and informally ("hostal", "pyament", "avelable"). This
// corrects near-miss spellings of the keywords the intent regexes below key
// off of, so small typos still route to the right intent — no external
// fuzzy-matching library needed.
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
        const curr = [i];
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(
                prev[j] + 1,       // deletion
                curr[j - 1] + 1,   // insertion
                prev[j - 1] + cost // substitution
            );
        }
        prev = curr;
    }
    return prev[n];
}

// Canonical spellings of the keywords used by the intent regexes further
// below. Any message word that's a close-but-not-exact match to one of these
// gets corrected before intent detection runs.
const KNOWN_KEYWORDS = [
    'hostel', 'hostels', 'room', 'rooms', 'bed', 'beds', 'stay', 'accommodation', 'rent',
    'booking', 'bookings', 'facility', 'facilities',
    'cheap', 'affordable', 'budget', 'inexpensive', 'expensive',
    'near', 'nearby', 'nearest', 'closest',
    'available', 'availability', 'vacant',
    'university', 'universities', 'college', 'colleges',
    'food', 'foods', 'meal', 'meals', 'dish', 'dishes', 'kitchen', 'kitchens',
    'menu', 'menus', 'order', 'orders', 'lunch', 'dinner', 'breakfast', 'biryani', 'karahi',
    'price', 'prices', 'cost', 'fee', 'rate', 'charge', 'rupee',
    'contact', 'phone', 'email', 'reach', 'number', 'support',
    'register', 'signup', 'login',
    'payment', 'stripe', 'jazzcash', 'easypaisa', 'card', 'transaction',
    'reserve', 'confirm', 'booked',
    'cancel', 'unbook', 'refund',
    'wifi', 'generator', 'laundry', 'parking',
];

function correctTypos(message) {
    return message.split(/(\s+)/).map((token) => {
        const word = token.toLowerCase();
        // Skip punctuation, short words, and already-correct/known words —
        // only worth correcting content words long enough that a typo is
        // distinguishable from a different real word.
        if (!/^[a-z]+$/.test(word) || word.length < 4 || KNOWN_KEYWORDS.includes(word)) {
            return token;
        }

        let best = null;
        let bestDist = Infinity;
        for (const keyword of KNOWN_KEYWORDS) {
            if (Math.abs(keyword.length - word.length) > 2) continue; // quick prune
            const dist = levenshtein(word, keyword);
            if (dist < bestDist) {
                bestDist = dist;
                best = keyword;
            }
        }

        const threshold = word.length <= 5 ? 1 : 2;
        return best && bestDist <= threshold ? best : token;
    }).join('');
}

// ─── Intent Detection ──────────────────────────────────────────────────────────
function detectIntent(msg) {
    const m = correctTypos(msg.toLowerCase());

    if (/\b(hi|hello|hey|salaam|assalam|salam|good morning|good evening|howdy|aoa)\b/.test(m)) return 'greeting';
    if (/\b(bye|goodbye|thanks|thank you|shukriya|ok done|khuda hafiz)\b/.test(m)) return 'farewell';

    // Casual conversation — checked before the topic-specific intents below so
    // "how are you" doesn't get swallowed by the bare word "how" in the howto check.
    if (/how('?re| are) you|how (r|you)( doing)?|what'?s up|whats up|who are you|what are you|are you (a )?(bot|human|real|ai)\b|what can you do|what do you do|your name|who made you/.test(m)) return 'small_talk';

    // Cheap / affordable intents — check BEFORE generic hostel/food
    if (/\b(cheap|affordable|sasta|budget|low cost|inexpensive|low price|least expensive)\b/.test(m) && /\b(hostels?|rooms?|beds?|stay|accommodation)\b/.test(m)) return 'cheap_hostel';
    if (/\b(cheap|affordable|sasta|budget|low cost|inexpensive|low price|least expensive)\b/.test(m) && /\b(foods?|meals?|dish(es)?|eat|khana|order)\b/.test(m)) return 'cheap_food';
    if (/\b(cheap|affordable|sasta|budget|low cost|inexpensive|low price)\b/.test(m)) return 'cheap_general';

    // Nearby / location based
    if (/\b(near|nearby|close|closest|nearest|pass mein|qareeb)\b/.test(m) && /\b(hostels?|rooms?|beds?|stay)\b/.test(m)) return 'nearby_hostel';
    if (/\b(near|nearby|close|closest|nearest)\b/.test(m) && /\b(foods?|kitchens?|eat|meals?)\b/.test(m)) return 'nearby_food';

    // Availability
    if (/\b(available|availability|empty|free|vacant|khali)\b/.test(m) && /\b(beds?|rooms?|hostels?)\b/.test(m)) return 'availability';

    // University based
    if (/\b(universit(y|ies)|colleges?|uet|pu|punjab|lums|ucp|gcu|fccu|shalimar|lcwu|umt|superior|hajvery)\b/.test(m) && /\b(hostels?|rooms?|near|stay)\b/.test(m)) return 'university_hostel';

    // Generic hostel / food
    if (/\b(hostels?|rooms?|beds?|accommodation|stay|rent|bookings?|facilit(y|ies))\b/.test(m)) return 'hostel';
    if (/\b(foods?|meals?|dish(es)?|eat|kitchens?|menus?|orders?|lunch|dinner|breakfast|khana|roti|biryani|karahi)\b/.test(m)) return 'food';

    if (/\b(price|cost|fee|rate|charge|pkr|rupee|how much|kitna|total)\b/.test(m)) return 'pricing';
    if (/\b(contact|phone|email|reach|number|call|support|help|aqib)\b/.test(m)) return 'contact';
    if (/how (to|do|does|can)\b|\b(work|use|register|signup|sign up|login|kaise|start)\b/.test(m)) return 'howto';
    if (/\b(pay|payment|stripe|jazzcash|easypaisa|card|transaction)\b/.test(m)) return 'payment';
    if (/\b(booking|book|reserve|confirm|booked|meri booking)\b/.test(m)) return 'booking_status';
    if (/\b(cancel|unbook|wapas|refund)\b/.test(m)) return 'cancel';
    if (/\b(facilities|wifi|ac|generator|laundry|cctv|parking|study room)\b/.test(m)) return 'facilities';

    return 'unknown';
}

// ─── Static Responses ──────────────────────────────────────────────────────────
function greetingResponse() {
    return `Assalam-o-Alaikum! Welcome to Student Facility System (SFS).

I'm the SFS assistant. Here's what I can help you with:
*Hostel bookings* — rooms, beds, availability
*Homemade food* — kitchen menus, dishes, prices
*Budget options* — cheapest hostels and meals
*Nearby hostels* — closest to your university
*Contact & support*

What would you like to know?`;
}

function smallTalkResponse() {
    return `I'm doing well, thanks for asking! I'm the SFS assistant — a bot built for the Student Facility System, here to help with hostel bookings, food orders, pricing, and account questions.

What can I help you with?`;
}

function contactResponse() {
    return `*Contact & Support*

Developer: Aqib Awan
Email: aqibawan0102@gmail.com
Phone: +92-310-4693600
Location: Shalimar College, Lahore, Pakistan

Support hours: Monday – Saturday, 9 AM – 6 PM PKT`;
}

function howToResponse() {
    return `*How to Use SFS*

For Students:
1. Register as a Student
2. Browse hostels on the map or filter by university and distance
3. Select a room, choose a bed, then pay via Stripe (PKR)
4. Browse food kitchens, add to cart, then checkout
5. Track your bookings and orders from your profile

For Hostel Owners:
1. Register as a Hostel Owner
2. Wait for admin approval
3. Add rooms and beds from your dashboard
4. Manage incoming bookings

For Kitchen Owners:
1. Register as a Kitchen Owner
2. Wait for admin approval
3. Add your menu dishes with prices (PKR)
4. Manage incoming orders in real time`;
}

function paymentResponse() {
    return `*Payment Options*

Stripe (active):
- Pay securely by credit or debit card
- All amounts are charged in PKR (Pakistani Rupees)
- Your card details are handled directly by Stripe — SFS never sees or stores them

JazzCash — coming soon
EasyPaisa — coming soon`;
}

function farewellResponse() {
    return `Thanks for using SFS. If you need anything else, I'm here.
Email: aqibawan0102@gmail.com | Phone: +92-310-4693600`;
}

function facilitiesResponse() {
    return `*Common Hostel Facilities on SFS*

- Wi-Fi (high-speed internet)
- AC (air conditioning)
- CCTV (24/7 security)
- Generator (uninterrupted power)
- Laundry service
- Parking
- Water cooler
- Study room

Each hostel lists its own available facilities on the *Hostels* page — check a hostel's detail card for its exact list.`;
}

function bookingStatusResponse() {
    return `*Your Bookings*

To view your current bookings:
1. Log in to your student account
2. Go to *Profile* → *My Bookings*
3. See all booked rooms and bed details

For food orders, go to *Profile* → *My Orders*.

Need help? Contact: +92-310-4693600`;
}

function cancelResponse() {
    return `*Cancellation Policy*

To cancel a hostel booking:
1. Go to *Profile* → *My Bookings*
2. Find the booking you want to cancel
3. Click *Cancel Booking*

Note: refund policies depend on the hostel owner. Contact the hostel directly for refund queries.

Support: aqibawan0102@gmail.com`;
}

function unknownResponse(userMessage) {
    return `I didn't quite understand: "${userMessage}"

Here's what I can help with:
- Type *hostel* for room and bed availability
- Type *cheap hostel* for the most affordable rooms
- Type *nearby hostel* for hostels near your university
- Type *food* for kitchen menus and dishes
- Type *price* for pricing info
- Type *payment* for payment methods
- Type *contact* to reach support

Feel free to ask naturally — I'll do my best to help.`;
}

// ─── Main Controller ────────────────────────────────────────────────────────────
exports.handleMessage = async (req, res) => {
    const userMessage = (req.body.text || '').trim();
    if (!userMessage) {
        return res.status(400).json({ reply: 'Please send a message.' });
    }

    const intent = detectIntent(userMessage);

    try {
        let reply = '';

        switch (intent) {

            case 'greeting':
                reply = greetingResponse();
                break;

            case 'small_talk':
                reply = smallTalkResponse();
                break;

            case 'farewell':
                reply = farewellResponse();
                break;

            case 'contact':
                reply = contactResponse();
                break;

            case 'howto':
                reply = howToResponse();
                break;

            case 'payment':
                reply = paymentResponse();
                break;

            case 'facilities':
                reply = facilitiesResponse();
                break;

            case 'booking_status':
                reply = bookingStatusResponse();
                break;

            case 'cancel':
                reply = cancelResponse();
                break;

            // ── Cheap Hostel ──────────────────────────────────────────────────
            case 'cheap_hostel': {
                const cheapRooms = await Hostelroom.find()
                    .sort({ price: 1 })
                    .limit(5)
                    .populate('hostelId', 'hostel_name hostel_address hostel_type isApproved isBanned');

                const validRooms = cheapRooms.filter(r => r.hostelId && r.hostelId.isApproved && !r.hostelId.isBanned);

                if (validRooms.length === 0) {
                    reply = `No hostel rooms found yet. Check back soon.`;
                } else {
                    const ratings = await getRatingsMap('hostel', validRooms.map(r => r.hostelId._id));
                    const list = validRooms.map(r =>
                        `*${r.hostelId.hostel_name}*\n   ${r.name} — PKR ${r.price}/bed\n   ${r.hostelId.hostel_address}\n   ${ratingText(ratings, r.hostelId._id)}`
                    ).join('\n\n');
                    reply = `*Most Affordable Hostel Rooms on SFS*\n\n${list}\n\nVisit the *Hostels* page to book the cheapest available bed.`;
                }
                break;
            }

            // ── Cheap Food ────────────────────────────────────────────────────
            case 'cheap_food': {
                const cheapDishes = await Dish.find({ availability: true })
                    .sort({ price: 1 })
                    .limit(8)
                    .populate('kitchenOwner', 'kitchen_name address isApproved isBanned');

                const validDishes = cheapDishes.filter(d => d.kitchenOwner && d.kitchenOwner.isApproved && !d.kitchenOwner.isBanned);

                if (validDishes.length === 0) {
                    reply = `No food items found yet. Check the Food page.`;
                } else {
                    const list = validDishes.map(d =>
                        `*${d.name}* (${d.category}) — PKR ${d.price}\n   ${d.kitchenOwner.kitchen_name} | ${d.kitchenOwner.address}`
                    ).join('\n\n');
                    reply = `*Most Affordable Food on SFS*\n\n${list}\n\nVisit the *Food* page to order budget-friendly meals.`;
                }
                break;
            }

            // ── Cheap General ─────────────────────────────────────────────────
            case 'cheap_general': {
                const cheapRoom = await Hostelroom.find().sort({ price: 1 }).limit(1).populate('hostelId', 'hostel_name isApproved isBanned');
                const cheapDish = await Dish.find({ availability: true }).sort({ price: 1 }).limit(1).populate('kitchenOwner', 'kitchen_name isApproved isBanned');

                const roomText = cheapRoom[0] && cheapRoom[0].hostelId?.isApproved
                    ? `Cheapest room: *${cheapRoom[0].name}* at PKR ${cheapRoom[0].price}/bed (${cheapRoom[0].hostelId.hostel_name})`
                    : `Browse the *Hostels* page for the cheapest rooms`;

                const dishText = cheapDish[0] && cheapDish[0].kitchenOwner?.isApproved
                    ? `Cheapest dish: *${cheapDish[0].name}* at PKR ${cheapDish[0].price} (${cheapDish[0].kitchenOwner.kitchen_name})`
                    : `Browse the *Food* page for the cheapest meals`;

                reply = `*Budget Options on SFS*\n\n${roomText}\n${dishText}\n\nUse the filters on the Hostels and Food pages to sort by price.`;
                break;
            }

            // ── Nearby Hostel ─────────────────────────────────────────────────
            case 'nearby_hostel': {
                // Extract university name from message if mentioned
                const m = userMessage.toLowerCase();
                const uniKeywords = [
                    { key: 'pu', name: 'University of the Punjab' },
                    { key: 'punjab', name: 'University of the Punjab' },
                    { key: 'uet', name: 'UET Lahore' },
                    { key: 'lums', name: 'LUMS' },
                    { key: 'ucp', name: 'University of Central Punjab' },
                    { key: 'gcu', name: 'Government College University' },
                    { key: 'fccu', name: 'Forman Christian College' },
                    { key: 'shalimar', name: 'Govt. Shalimar Graduate College' },
                    { key: 'lcwu', name: 'Lahore College for Women University' },
                    { key: 'umt', name: 'University of Management & Technology' },
                    { key: 'superior', name: 'Superior University' },
                    { key: 'hajvery', name: 'Hajvery University' },
                ];

                const matched = uniKeywords.find(u => m.includes(u.key));

                if (matched) {
                    // Find hostels with this university in nearby_institutes
                    const hostels = await HostelOwner.find({
                        isApproved: true,
                        isBanned: false,
                        'nearby_institutes.university': { $regex: matched.name.split(' ')[0], $options: 'i' }
                    }).select('hostel_name hostel_address hostel_type nearby_institutes').limit(5);

                    if (hostels.length === 0) {
                        reply = `No hostels found near *${matched.name}* yet.\n\nTry the Hostels page map and filter by university.`;
                    } else {
                        const ratings = await getRatingsMap('hostel', hostels.map(h => h._id));
                        const list = hostels.map(h => {
                            const inst = h.nearby_institutes.find(i => i.university.toLowerCase().includes(matched.key));
                            const dist = inst ? ` — ${inst.distance}` : '';
                            return `*${h.hostel_name}*${dist}\n   ${h.hostel_address}\n   ${h.hostel_type}\n   ${ratingText(ratings, h._id)}`;
                        }).join('\n\n');
                        reply = `*Hostels Near ${matched.name}*\n\n${list}\n\nUse the distance filter on the Hostels page for more options.`;
                    }
                } else {
                    // No specific university mentioned — show all with distances
                    const hostels = await HostelOwner.find({ isApproved: true, isBanned: false })
                        .select('hostel_name hostel_address nearby_institutes hostel_type')
                        .limit(5);

                    const list = hostels.map(h => {
                        const inst = h.nearby_institutes?.[0];
                        const distText = inst ? `\n   ${inst.university} — ${inst.distance}` : '';
                        return `*${h.hostel_name}*\n   ${h.hostel_address}${distText}`;
                    }).join('\n\n');

                    reply = `*Hostels with University Distances*\n\n${list}\n\nTip: on the Hostels page, type your university name and set a max distance to filter nearby hostels.`;
                }
                break;
            }

            // ── Nearby Food ───────────────────────────────────────────────────
            case 'nearby_food': {
                const kitchens = await KitchenOwner.find({ isApproved: true, isBanned: false })
                    .select('kitchen_name address kitchen_description')
                    .limit(6);

                if (kitchens.length === 0) {
                    reply = `No kitchens available yet. Check back soon.`;
                } else {
                    const ratings = await getRatingsMap('kitchen', kitchens.map(k => k._id));
                    const list = kitchens.map(k =>
                        `*${k.kitchen_name}*\n   ${k.address}\n   ${ratingText(ratings, k._id)}`
                    ).join('\n\n');
                    reply = `*Food Kitchens in Lahore*\n\n${list}\n\nVisit the *Food* page to browse menus and place orders.`;
                }
                break;
            }

            // ── University Hostel ─────────────────────────────────────────────
            case 'university_hostel': {
                const m = userMessage.toLowerCase();
                const uniMap = {
                    'uet': 'UET', 'pu': 'Punjab', 'punjab': 'Punjab',
                    'lums': 'LUMS', 'ucp': 'Central Punjab', 'gcu': 'Government College',
                    'fccu': 'Forman', 'shalimar': 'Shalimar', 'lcwu': 'Women',
                    'umt': 'Management', 'superior': 'Superior', 'hajvery': 'Hajvery'
                };

                const matchedKey = Object.keys(uniMap).find(k => m.includes(k));
                const searchTerm = matchedKey ? uniMap[matchedKey] : null;

                const query = searchTerm
                    ? { isApproved: true, isBanned: false, 'nearby_institutes.university': { $regex: searchTerm, $options: 'i' } }
                    : { isApproved: true, isBanned: false };

                const hostels = await HostelOwner.find(query)
                    .select('hostel_name hostel_address hostel_type nearby_institutes facilities')
                    .limit(5);

                if (hostels.length === 0) {
                    reply = `No hostels found for that university.\n\nVisit the *Hostels* page and use the university filter.`;
                } else {
                    const ratings = await getRatingsMap('hostel', hostels.map(h => h._id));
                    const list = hostels.map(h => {
                        const inst = searchTerm
                            ? h.nearby_institutes.find(i => i.university.toLowerCase().includes(searchTerm.toLowerCase()))
                            : h.nearby_institutes?.[0];
                        const distText = inst ? ` (${inst.distance} from ${inst.university})` : '';
                        return `*${h.hostel_name}*${distText}\n   ${h.hostel_address}\n   ${h.hostel_type}\n   Facilities: ${(h.facilities || []).slice(0, 3).join(', ') || 'not listed'}\n   ${ratingText(ratings, h._id)}`;
                    }).join('\n\n');
                    reply = `*Hostels Near Your University*\n\n${list}\n\nVisit the *Hostels* page to view rooms and book a bed.`;
                }
                break;
            }

            // ── Availability ──────────────────────────────────────────────────
            case 'availability': {
                const availableBeds = await RoomBed.countDocuments({ isBooked: false });
                const totalBeds = await RoomBed.countDocuments();
                const bookedBeds = totalBeds - availableBeds;

                const availableRooms = await Hostelroom.countDocuments({ availability: true });

                reply = `*Current Availability on SFS*\n\nBeds: ${availableBeds} available out of ${totalBeds} total\nRooms: ${availableRooms} rooms available\nBooked: ${bookedBeds} beds taken\n\nVisit the *Hostels* page to see which specific beds are free and book one.`;
                break;
            }

            // ── Generic Hostel ────────────────────────────────────────────────
            case 'hostel': {
                const hostels = await HostelOwner.find({ isApproved: true, isBanned: false })
                    .select('hostel_name hostel_address hostel_type facilities nearby_institutes')
                    .limit(5);

                const availableBeds = await RoomBed.countDocuments({ isBooked: false });
                const totalBeds = await RoomBed.countDocuments();

                if (hostels.length === 0) {
                    reply = `No approved hostels listed yet. Check back soon or contact +92-310-4693600.`;
                } else {
                    const ratings = await getRatingsMap('hostel', hostels.map(h => h._id));
                    const list = hostels.map(h => {
                        const inst = h.nearby_institutes?.[0];
                        const distText = inst ? `\n   ${inst.university} — ${inst.distance}` : '';
                        return `*${h.hostel_name}*\n   ${h.hostel_address}\n   ${h.hostel_type}\n   Facilities: ${(h.facilities || []).slice(0, 3).join(', ') || 'not listed'}${distText}\n   ${ratingText(ratings, h._id)}`;
                    }).join('\n\n');
                    reply = `*Available Hostels on SFS*\n\n${list}\n\nBeds: ${availableBeds} / ${totalBeds} available\n\nYou can also ask me: *cheap hostel*, *nearby hostel*, or *hostel near UET*.`;
                }
                break;
            }

            // ── Generic Food ──────────────────────────────────────────────────
            case 'food': {
                const kitchens = await KitchenOwner.find({ isApproved: true, isBanned: false })
                    .select('kitchen_name address kitchen_description')
                    .limit(4);

                const dishes = await Dish.find({ availability: true })
                    .sort({ price: 1 })
                    .select('name price category')
                    .limit(8);

                if (kitchens.length === 0) {
                    reply = `No approved kitchens yet. Check back soon.`;
                } else {
                    const ratings = await getRatingsMap('kitchen', kitchens.map(k => k._id));
                    const kitchenList = kitchens.map(k =>
                        `*${k.kitchen_name}* — ${k.address} — ${ratingText(ratings, k._id)}`
                    ).join('\n');

                    const dishList = dishes.length > 0
                        ? dishes.map(d => `- ${d.name} (${d.category}) — PKR ${d.price}`).join('\n')
                        : 'No dishes listed yet.';

                    reply = `*Food Kitchens on SFS*\n\n${kitchenList}\n\n*Available Dishes (Low to High):*\n${dishList}\n\nYou can also ask me: *cheap food* or *food near me*.\nVisit the *Food* page to place an order.`;
                }
                break;
            }

            // ── Pricing ───────────────────────────────────────────────────────
            case 'pricing': {
                const rooms = await Hostelroom.find().sort({ price: 1 }).select('name price').limit(5);
                const dishes = await Dish.find({ availability: true }).sort({ price: 1 }).select('name price').limit(5);

                const roomPricing = rooms.length > 0
                    ? rooms.map(r => `- ${r.name}: PKR ${r.price}/bed`).join('\n')
                    : '- Browse the Hostels page for room prices';

                const dishPricing = dishes.length > 0
                    ? dishes.map(d => `- ${d.name}: PKR ${d.price}`).join('\n')
                    : '- Browse the Food page for dish prices';

                reply = `*Pricing (all in PKR)*\n\n*Hostel bed prices (cheapest first):*\n${roomPricing}\n\n*Food dish prices (cheapest first):*\n${dishPricing}\n\nAll payments are processed via Stripe in PKR.`;
                break;
            }

            default:
                reply = unknownResponse(userMessage);
        }

        return res.json({ reply });

    } catch (error) {
        console.error('Chatbot error:', error);
        return res.json({
            reply: `I'm having trouble fetching live data right now.\n\nFor immediate help:\nEmail: aqibawan0102@gmail.com\nPhone: +92-310-4693600`
        });
    }
};
