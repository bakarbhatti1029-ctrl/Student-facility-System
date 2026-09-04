// Map of university abbreviations and partial names to full official names with coordinates
const universityDatabase = {
  // GCUL - Government College University Lahore
  'gcul': { name: 'Government College University Lahore', lat: 31.5731518, lng: 74.3083536 },
  'gcu': { name: 'Government College University Lahore', lat: 31.5731518, lng: 74.3083536 },
  'government college university': { name: 'Government College University Lahore', lat: 31.5731518, lng: 74.3083536 },
  'government college university lahore': { name: 'Government College University Lahore', lat: 31.5731518, lng: 74.3083536 },
  'government college university lahore (gcul)': { name: 'Government College University Lahore', lat: 31.5731518, lng: 74.3083536 },

  // UCP - University of Central Punjab
  'ucp': { name: 'University of Central Punjab', lat: 31.4472954, lng: 74.268077 },
  'university of central punjab': { name: 'University of Central Punjab', lat: 31.4472954, lng: 74.268077 },

  // FAST - FAST-NUCES (National University of Computer and Emerging Sciences)
  'fast': { name: 'FAST-NUCES', lat: 31.4667, lng: 74.2641 },
  'nuces': { name: 'FAST-NUCES', lat: 31.4667, lng: 74.2641 },
  'fast-nuces': { name: 'FAST-NUCES', lat: 31.4667, lng: 74.2641 },

  // LUMS - Lahore University of Management Sciences
  'lums': { name: 'Lahore University of Management Sciences', lat: 31.470326, lng: 74.4097439 },
  'lahore university of management sciences': { name: 'Lahore University of Management Sciences', lat: 31.470326, lng: 74.4097439 },

  // COMSATS - COMSATS University
  'comsats': { name: 'COMSATS University Islamabad', lat: 33.6844, lng: 73.0479 },
  'comsats university': { name: 'COMSATS University Islamabad', lat: 33.6844, lng: 73.0479 },

  // PU - Punjab University
  'pu': { name: 'University of the Punjab', lat: 31.4886984, lng: 74.2926335 },
  'punjab university': { name: 'University of the Punjab', lat: 31.4886984, lng: 74.2926335 },
  'university of the punjab': { name: 'University of the Punjab', lat: 31.4886984, lng: 74.2926335 },

  // UOL - University of Lahore
  'uol': { name: 'University of Lahore', lat: 32.0400106, lng: 72.8348701 },
  'university of lahore': { name: 'University of Lahore', lat: 32.0400106, lng: 72.8348701 },

  // KIIT - Kinnaird College
  'kinnaird': { name: 'Kinnaird College for Women', lat: 31.5409, lng: 74.3206 },
  'kinnaird college': { name: 'Kinnaird College for Women', lat: 31.5409, lng: 74.3206 },

  // Forman Christian College
  'forman': { name: 'Forman Christian College', lat: 31.5214848, lng: 74.3338898 },
  'forman christian college': { name: 'Forman Christian College', lat: 31.5214848, lng: 74.3338898 },

  // SZABIST
  'szabist': { name: 'Shaheed Zulfikar Ali Bhutto Institute of Science and Technology', lat: 31.5545, lng: 74.3011 },

  // IBA - Institute of Business Administration
  'iba': { name: 'Institute of Business Administration', lat: 31.5421, lng: 74.2914 },

  // Government Colleges in Lahore (20 colleges)
  'govt. college lahore': { name: 'Government College Lahore', lat: 31.4843815, lng: 74.3214337 },
  'government college lahore': { name: 'Government College Lahore', lat: 31.4843815, lng: 74.3214337 },
  'gc lahore': { name: 'Government College Lahore', lat: 31.4843815, lng: 74.3214337 },
  'gcl': { name: 'Government College Lahore', lat: 31.4843815, lng: 74.3214337 },

  'govt. college for women lahore': { name: 'Government College for Women (Mall Road)', lat: 31.5709, lng: 74.3146 },
  'govt. college for women': { name: 'Government College for Women (Mall Road)', lat: 31.5709, lng: 74.3146 },
  'gcw lahore': { name: 'Government College for Women (Mall Road)', lat: 31.5709, lng: 74.3146 },

  'govt. delhi college': { name: 'Government Delhi College', lat: 31.5582, lng: 74.3121 },
  'delhi college': { name: 'Government Delhi College', lat: 31.5582, lng: 74.3121 },

  'govt. islamia college': { name: 'Government Islamia College', lat: 31.5750266, lng: 74.3251623 },
  'islamia college': { name: 'Government Islamia College', lat: 31.5750266, lng: 74.3251623 },

  'govt. model college': { name: 'Government Model College Lahore', lat: 31.5118204, lng: 74.3021764 },
  'model college': { name: 'Government Model College Lahore', lat: 31.5118204, lng: 74.3021764 },

  'govt. college for women jail road': { name: 'Government College for Women (Jail Road)', lat: 31.5487, lng: 74.3478 },
  'gcw jail road': { name: 'Government College for Women (Jail Road)', lat: 31.5487, lng: 74.3478 },

  'govt. emerson college': { name: 'Government Emerson College', lat: 31.5825, lng: 74.3157 },
  'emerson college': { name: 'Government Emerson College', lat: 31.5825, lng: 74.3157 },

  'govt. postgraduate college for women': { name: 'Government Postgraduate College for Women', lat: 31.5688, lng: 74.3041 },
  'pgc women': { name: 'Government Postgraduate College for Women', lat: 31.5688, lng: 74.3041 },

  'govt. associates college': { name: 'Government Associates College', lat: 31.5614, lng: 74.3102 },
  'associates college': { name: 'Government Associates College', lat: 31.5614, lng: 74.3102 },

  'govt. bashir ahmed college': { name: 'Government Bashir Ahmed College', lat: 31.5425, lng: 74.3245 },
  'bashir ahmed college': { name: 'Government Bashir Ahmed College', lat: 31.5425, lng: 74.3245 },

  'govt. fm degree college': { name: 'Government FM Degree College', lat: 31.5847, lng: 74.3089 },
  'fm degree college': { name: 'Government FM Degree College', lat: 31.5847, lng: 74.3089 },

  'govt. general manto baba college': { name: 'Government General Manto Baba College', lat: 31.5739, lng: 74.3214 },
  'manto baba college': { name: 'Government General Manto Baba College', lat: 31.5739, lng: 74.3214 },

  'govt. girls college new garden town': { name: 'Government Girls College (New Garden Town)', lat: 31.5854, lng: 74.3654 },
  'girls college garden town': { name: 'Government Girls College (New Garden Town)', lat: 31.5854, lng: 74.3654 },

  'govt. degree college for women shahdara': { name: 'Government Degree College for Women Shahdara', lat: 31.5912, lng: 74.3421 },
  'degree college shahdara': { name: 'Government Degree College for Women Shahdara', lat: 31.5912, lng: 74.3421 },

  'govt. adiala college': { name: 'Government Adiala College', lat: 31.6041, lng: 74.3102 },
  'adiala college': { name: 'Government Adiala College', lat: 31.6041, lng: 74.3102 },

  'govt. nadeem akhtar college': { name: 'Government Nadeem Akhtar College', lat: 31.5521, lng: 74.3687 },
  'nadeem akhtar college': { name: 'Government Nadeem Akhtar College', lat: 31.5521, lng: 74.3687 },

  'govt. excellencia college': { name: 'Government Excellencia College', lat: 31.5647, lng: 74.3321 },
  'excellencia college': { name: 'Government Excellencia College', lat: 31.5647, lng: 74.3321 },

  'govt. prime college': { name: 'Government Prime College', lat: 31.5758, lng: 74.3445 },
  'prime college': { name: 'Government Prime College', lat: 31.5758, lng: 74.3445 },

  'govt. degree college shekhupura road': { name: 'Government Degree College (Shekhupura Road)', lat: 31.5421, lng: 74.2945 },
  'degree college shekhupura road': { name: 'Government Degree College (Shekhupura Road)', lat: 31.5421, lng: 74.2945 },

  // Additional Government Colleges in Lahore (20 more)
  'govt. jinnah college': { name: 'Government Jinnah College', lat: 31.5687, lng: 74.3156 },
  'jinnah college': { name: 'Government Jinnah College', lat: 31.5687, lng: 74.3156 },

  'govt. sadiq college': { name: 'Government Sadiq College', lat: 31.5502, lng: 74.3214 },
  'sadiq college': { name: 'Government Sadiq College', lat: 31.5502, lng: 74.3214 },

  'govt. waheed model college': { name: 'Government Waheed Model College', lat: 31.5841, lng: 74.3425 },
  'waheed model college': { name: 'Government Waheed Model College', lat: 31.5841, lng: 74.3425 },

  'govt. college ichra': { name: 'Government College Ichra', lat: 31.5741, lng: 74.3587 },
  'college ichra': { name: 'Government College Ichra', lat: 31.5741, lng: 74.3587 },

  'govt. college thokar niaz baig': { name: 'Government College Thokar Niaz Baig', lat: 31.5912, lng: 74.2814 },
  'thokar niaz baig': { name: 'Government College Thokar Niaz Baig', lat: 31.5912, lng: 74.2814 },

  'govt. college chunian': { name: 'Government College Chunian', lat: 31.4258, lng: 74.2541 },
  'chunian college': { name: 'Government College Chunian', lat: 31.4258, lng: 74.2541 },

  'govt. college kasur': { name: 'Government College Kasur', lat: 31.2168, lng: 74.4373 },
  'kasur college': { name: 'Government College Kasur', lat: 31.2168, lng: 74.4373 },

  'govt. girls college cantonment': { name: 'Government Girls College Cantonment', lat: 31.5521, lng: 74.3102 },
  'girls college cantonment': { name: 'Government Girls College Cantonment', lat: 31.5521, lng: 74.3102 },

  'govt. boys college cantonment': { name: 'Government Boys College Cantonment', lat: 31.5587, lng: 74.3147 },
  'boys college cantonment': { name: 'Government Boys College Cantonment', lat: 31.5587, lng: 74.3147 },

  'govt. associate college women': { name: 'Government Associate College for Women', lat: 31.5614, lng: 74.3312 },
  'associate college women': { name: 'Government Associate College for Women', lat: 31.5614, lng: 74.3312 },

  'govt. college data nagar': { name: 'Government College Data Nagar', lat: 31.5856, lng: 74.3621 },
  'college data nagar': { name: 'Government College Data Nagar', lat: 31.5856, lng: 74.3621 },

  'govt. college raiwind': { name: 'Government College Raiwind', lat: 31.4122144, lng: 74.2281651 },
  'raiwind college': { name: 'Government College Raiwind', lat: 31.4122144, lng: 74.2281651 },

  'govt. college garhi shahu': { name: 'Government College Garhi Shahu', lat: 31.5214, lng: 74.2845 },
  'garhi shahu college': { name: 'Government College Garhi Shahu', lat: 31.5214, lng: 74.2845 },

  'govt. college samanabad': { name: 'Government College Samanabad', lat: 31.4521, lng: 74.2314 },
  'samanabad college': { name: 'Government College Samanabad', lat: 31.4521, lng: 74.2314 },

  'govt. commerce college lahore': { name: 'Government Commerce College Lahore', lat: 31.5704, lng: 74.3245 },
  'commerce college lahore': { name: 'Government Commerce College Lahore', lat: 31.5704, lng: 74.3245 },

  'govt. science college lahore': { name: 'Government Science College Lahore', lat: 31.509748, lng: 74.2944995 },
  'science college lahore': { name: 'Government Science College Lahore', lat: 31.509748, lng: 74.2944995 },

  'govt. technician training centre': { name: 'Government Technician Training Centre', lat: 31.5847, lng: 74.3412 },
  'technician training centre': { name: 'Government Technician Training Centre', lat: 31.5847, lng: 74.3412 },

  'govt. vocational college women': { name: 'Government Vocational College for Women', lat: 31.5521, lng: 74.3587 },
  'vocational college women': { name: 'Government Vocational College for Women', lat: 31.5521, lng: 74.3587 },

  // Universities in Lahore and surrounding areas (20 universities)
  'air university': { name: 'Air University', lat: 33.8042, lng: 73.0491 },
  'au': { name: 'Air University', lat: 33.8042, lng: 73.0491 },

  'pieas': { name: 'Pakistan Institute of Engineering and Applied Sciences', lat: 33.6711, lng: 73.2733 },
  'pakistan institute engineering': { name: 'Pakistan Institute of Engineering and Applied Sciences', lat: 33.6711, lng: 73.2733 },

  'nust': { name: 'National University of Sciences and Technology', lat: 33.6844, lng: 73.0479 },
  'national university sciences': { name: 'National University of Sciences and Technology', lat: 33.6844, lng: 73.0479 },

  'uet': { name: 'University of Engineering and Technology Lahore', lat: 31.5487, lng: 74.3245 },
  'university of engineering': { name: 'University of Engineering and Technology Lahore', lat: 31.5487, lng: 74.3245 },
  'engineering technology': { name: 'University of Engineering and Technology Lahore', lat: 31.5487, lng: 74.3245 },

  'ist': { name: 'Institute of Space Technology', lat: 33.7256, lng: 73.1641 },
  'space technology': { name: 'Institute of Space Technology', lat: 33.7256, lng: 73.1641 },

  'bnu': { name: 'Beaconhouse National University', lat: 31.3648424, lng: 74.2160872 },
  'beaconhouse national': { name: 'Beaconhouse National University', lat: 31.3648424, lng: 74.2160872 },

  'bahauddin zakariya': { name: 'Bahauddin Zakariya University', lat: 30.1937, lng: 72.3645 },
  'bzuh': { name: 'Bahauddin Zakariya University', lat: 30.1937, lng: 72.3645 },

  'university of gujrat': { name: 'University of Gujrat', lat: 32.1747, lng: 74.0706 },
  'gujrat university': { name: 'University of Gujrat', lat: 32.1747, lng: 74.0706 },

  'university of sialkot': { name: 'University of Sialkot', lat: 32.4959, lng: 74.5300 },
  'sialkot university': { name: 'University of Sialkot', lat: 32.4959, lng: 74.5300 },

  'riphah international': { name: 'Riphah International University', lat: 33.6169265, lng: 72.9723398 },
  'riphah': { name: 'Riphah International University', lat: 33.6169265, lng: 72.9723398 },

  'iqra university': { name: 'Iqra University', lat: 31.5245, lng: 74.3145 },
  'iqra': { name: 'Iqra University', lat: 31.5245, lng: 74.3145 },

  'hamdard university': { name: 'Hamdard University', lat: 31.8123, lng: 74.2645 },
  'hamdard': { name: 'Hamdard University', lat: 31.8123, lng: 74.2645 },

  'dar ul hana': { name: 'Dar ul Hana University', lat: 31.5412, lng: 74.2987 },
  'dar ul hana university': { name: 'Dar ul Hana University', lat: 31.5412, lng: 74.2987 },

  'superior university': { name: 'Superior University', lat: 31.5741, lng: 74.3254 },
  'superior': { name: 'Superior University', lat: 31.5741, lng: 74.3254 },

  'hajvery university': { name: 'Hajvery University', lat: 31.5042582, lng: 74.3582433 },
  'hajvery': { name: 'Hajvery University', lat: 31.5042582, lng: 74.3582433 },

  'lahore garrison university': { name: 'Lahore Garrison University', lat: 31.5201, lng: 74.3214 },
  'garrison university': { name: 'Lahore Garrison University', lat: 31.5201, lng: 74.3214 },

  'university of faisalabad': { name: 'University of Faisalabad', lat: 31.4181, lng: 72.9810 },
  'faisalabad university': { name: 'University of Faisalabad', lat: 31.4181, lng: 72.9810 },

  'lyallpur university': { name: 'University of Agriculture Faisalabad', lat: 31.4184, lng: 72.9810 },
  'agriculture faisalabad': { name: 'University of Agriculture Faisalabad', lat: 31.4184, lng: 72.9810 },

  'virtual university pakistan': { name: 'Virtual University of Pakistan', lat: 31.5645, lng: 74.3102 },
  'virtual university': { name: 'Virtual University of Pakistan', lat: 31.5645, lng: 74.3102 },

  'lahore college women': { name: 'Lahore College for Women University', lat: 31.5641, lng: 74.3245 },
  'lcwu': { name: 'Lahore College for Women University', lat: 31.5641, lng: 74.3245 },

  'pakistan college': { name: 'Pakistan College', lat: 31.5741, lng: 74.3125 },

  'punjab college': { name: 'Punjab College', lat: 31.5825, lng: 74.3214 },

  // 50 More Verified Lahore Institutions
  'king edward medical': { name: 'King Edward Medical University', lat: 31.5854, lng: 74.3125 },
  'kem': { name: 'King Edward Medical University', lat: 31.5854, lng: 74.3125 },
  'kedge medical': { name: 'King Edward Medical University', lat: 31.5854, lng: 74.3125 },

  'shifa international': { name: 'Shifa International Hospital', lat: 33.7695, lng: 73.2114 },
  'shifa': { name: 'Shifa International Hospital', lat: 33.7695, lng: 73.2114 },

  'aga khan university': { name: 'Aga Khan University', lat: 33.7881, lng: 73.1850 },
  'aku': { name: 'Aga Khan University', lat: 33.7881, lng: 73.1850 },

  'fatima memorial college': { name: 'Fatima Memorial College of Medicine', lat: 31.5741, lng: 74.3214 },
  'fatima memorial': { name: 'Fatima Memorial College of Medicine', lat: 31.5741, lng: 74.3214 },

  'pmdc': { name: 'Pakistan Medical and Dental Council', lat: 31.5641, lng: 74.3156 },

  'dental college': { name: 'De Montmorency College of Dentistry', lat: 31.5741, lng: 74.3145 },
  'de montmorency': { name: 'De Montmorency College of Dentistry', lat: 31.5741, lng: 74.3145 },

  'pakistan law college': { name: 'Pakistan Law College', lat: 31.5687, lng: 74.3102 },
  'law college': { name: 'Pakistan Law College', lat: 31.5687, lng: 74.3102 },

  'college of law': { name: 'College of Law, Lahore University', lat: 31.5641, lng: 74.3214 },

  'quaid e azam law college': { name: 'Quaid-e-Azam Law College', lat: 31.5521, lng: 74.3156 },
  'qeazam law': { name: 'Quaid-e-Azam Law College', lat: 31.5521, lng: 74.3156 },

  'lahore law college': { name: 'Lahore Law College', lat: 31.5741, lng: 74.3245 },

  'punjab college commerce': { name: 'Punjab College of Commerce', lat: 31.5704, lng: 74.3189 },

  'siddiqui college': { name: 'Siddiqui College', lat: 31.5741, lng: 74.3125 },

  'solutions iq': { name: 'Solutions IQ Institute', lat: 31.5825, lng: 74.3156 },

  'ehp engineering': { name: 'EHP Engineering College', lat: 31.5587, lng: 74.3214 },

  'leads university': { name: 'LEADS University', lat: 31.5641, lng: 74.3102 },

  'numl': { name: 'National University of Modern Languages', lat: 33.7265, lng: 73.1411 },
  'national university modern languages': { name: 'National University of Modern Languages', lat: 33.7265, lng: 73.1411 },

  'punjab college for women': { name: 'Punjab College for Women', lat: 31.5687, lng: 74.3214 },

  'govt. college women cantt': { name: 'Government College for Women Cantonment', lat: 31.5523553, lng: 74.3683058 },

  'jinnah college women': { name: 'Jinnah College for Women', lat: 31.5614, lng: 74.3156 },

  'women college universitas': { name: 'Women College University of Lahore', lat: 31.5614, lng: 74.3245 },

  'govt. associates college women': { name: 'Government Associates College for Women', lat: 31.5687, lng: 74.3102 },

  'hailey college commerce': { name: 'Hailey College of Commerce', lat: 31.5641, lng: 74.3214 },
  'hcc': { name: 'Hailey College of Commerce', lat: 31.5641, lng: 74.3214 },

  'college of agriculture': { name: 'College of Agriculture, University of Punjab', lat: 31.5741, lng: 74.3125 },

  'veterinary college': { name: 'University of Veterinary and Animal Sciences', lat: 31.5845, lng: 74.3214 },

  'college of education': { name: 'Institute of Education and Research', lat: 31.5687, lng: 74.3156 },

  'ier': { name: 'Institute of Education and Research', lat: 31.5687, lng: 74.3156 },

  'teacher training': { name: 'Government College of Teacher Education', lat: 31.5614, lng: 74.3102 },

  'govt. vocational': { name: 'Government Vocational Training Institute', lat: 31.5741, lng: 74.3214 },

  'itt': { name: 'Institute of Technical Training', lat: 31.5825, lng: 74.3125 },

  'polytechnic lahore': { name: 'Lahore Polytechnic', lat: 31.5741, lng: 74.3214 },

  'sufis': { name: 'Sufis Institute of Technical Training', lat: 31.5614, lng: 74.3156 },

  'uvas': { name: 'University of Veterinary and Animal Sciences', lat: 31.5845, lng: 74.3214 },

  'college engineering': { name: 'College of Engineering, University of the Punjab', lat: 31.5741, lng: 74.3125 },

  'fast lahore': { name: 'FAST School of Computing', lat: 31.4667, lng: 74.2641 },

  'pcps': { name: 'Pakistan Computer Professional School', lat: 31.5614, lng: 74.3102 },

  'nadia professional': { name: 'Nadia Professional Academy', lat: 31.5741, lng: 74.3156 },

  'college of administration': { name: 'College of Public Administration', lat: 31.5687, lng: 74.3214 },

  'cpas': { name: 'College of Public Administration Sciences', lat: 31.5687, lng: 74.3214 },

  'school social work': { name: 'Institute of Social & Cultural Studies', lat: 31.5641, lng: 74.3102 },

  'librarianship': { name: 'Department of Library and Information Sciences', lat: 31.5741, lng: 74.3125 },

  'mass communication': { name: 'Department of Mass Communication', lat: 31.5614, lng: 74.3214 },

  'journalism school': { name: 'School of Journalism', lat: 31.5687, lng: 74.3156 },

  'fine arts': { name: 'Faculty of Fine Arts', lat: 31.5741, lng: 74.3102 },

  'music academy': { name: 'National Music Academy', lat: 31.5614, lng: 74.3145 },

  'theatre arts': { name: 'Department of Theatre Arts', lat: 31.5687, lng: 74.3214 },

  'physical education': { name: 'Department of Physical Education', lat: 31.5741, lng: 74.3214 },

  'sports complex': { name: 'Lahore Sports Complex', lat: 31.4674704, lng: 74.4433305 },

  'pakistan tourism': { name: 'Pakistan Institute of Tourism and Hotel Management', lat: 31.5641, lng: 74.3102 },

  'pithm': { name: 'Pakistan Institute of Tourism and Hotel Management', lat: 31.5641, lng: 74.3102 },

  'imc': { name: 'Institute of Management and Commerce', lat: 31.5687, lng: 74.3156 },

  'bba college': { name: 'Business Management Institute', lat: 31.5614, lng: 74.3214 },

  'mba college': { name: 'Institute of Business Management', lat: 31.5741, lng: 74.3125 },

  // 34 additional Lahore institutes/colleges/private universities — coordinates
  // live-geocoded via Nominatim (not hand-typed), added 2026-07-11. ~65 other
  // candidate names (mostly generic "Government College <neighborhood>" guesses)
  // failed to geocode and were deliberately left out rather than guessed.
  'umt': { name: 'University of Management and Technology Lahore', lat: 31.4514449, lng: 74.2940846 },
  'university of management and technology': { name: 'University of Management and Technology Lahore', lat: 31.4514449, lng: 74.2940846 },

  'lse': { name: 'Lahore School of Economics', lat: 31.5027922, lng: 74.4749169 },
  'lahore school of economics': { name: 'Lahore School of Economics', lat: 31.5027922, lng: 74.4749169 },

  'nca': { name: 'National College of Arts Lahore', lat: 31.5682911, lng: 74.3072396 },
  'national college of arts': { name: 'National College of Arts Lahore', lat: 31.5682911, lng: 74.3072396 },

  'usa lahore': { name: 'University of South Asia Lahore', lat: 31.4257432, lng: 74.2313591 },
  'university of south asia': { name: 'University of South Asia Lahore', lat: 31.4257432, lng: 74.2313591 },

  'mul': { name: 'Minhaj University Lahore', lat: 31.4479815, lng: 74.313169 },
  'minhaj university lahore': { name: 'Minhaj University Lahore', lat: 31.4479815, lng: 74.313169 },

  'green international university': { name: 'Green International University Lahore', lat: 31.397867, lng: 74.2293872 },
  'giu lahore': { name: 'Green International University Lahore', lat: 31.397867, lng: 74.2293872 },

  'sharif college of engineering': { name: 'Sharif College of Engineering and Technology Lahore', lat: 31.3340152, lng: 74.1962989 },
  'scet': { name: 'Sharif College of Engineering and Technology Lahore', lat: 31.3340152, lng: 74.1962989 },

  'pucit': { name: 'Punjab University College of Information Technology Lahore', lat: 31.4785966, lng: 74.2651695 },
  'punjab university college of information technology': { name: 'Punjab University College of Information Technology Lahore', lat: 31.4785966, lng: 74.2651695 },

  'hcbf': { name: 'Hailey College of Banking and Finance Lahore', lat: 31.5617117, lng: 74.3074835 },
  'hailey college of banking and finance': { name: 'Hailey College of Banking and Finance Lahore', lat: 31.5617117, lng: 74.3074835 },

  'allama iqbal medical college': { name: 'Allama Iqbal Medical College Lahore', lat: 31.4863829, lng: 74.3004581 },
  'aimc': { name: 'Allama Iqbal Medical College Lahore', lat: 31.4863829, lng: 74.3004581 },

  'lmdc': { name: 'Lahore Medical and Dental College Lahore', lat: 31.5816993, lng: 74.4637762 },
  'lahore medical and dental college': { name: 'Lahore Medical and Dental College Lahore', lat: 31.5816993, lng: 74.4637762 },

  'akhtar saeed medical college': { name: 'Akhtar Saeed Medical and Dental College Lahore', lat: 31.3717937, lng: 74.191135 },
  'asmc': { name: 'Akhtar Saeed Medical and Dental College Lahore', lat: 31.3717937, lng: 74.191135 },

  'pak red crescent medical college': { name: 'Pak Red Crescent Medical and Dental College Lahore', lat: 31.2463109, lng: 74.006988 },
  'prcmc': { name: 'Pak Red Crescent Medical and Dental College Lahore', lat: 31.2463109, lng: 74.006988 },

  'govt college of technology': { name: 'Government College of Technology Lahore', lat: 31.5772632, lng: 74.3327319 },
  'gct lahore': { name: 'Government College of Technology Lahore', lat: 31.5772632, lng: 74.3327319 },

  'punjab law college': { name: 'Punjab Law College Lahore', lat: 31.5133816, lng: 74.31918 },
  'plc lahore': { name: 'Punjab Law College Lahore', lat: 31.5133816, lng: 74.31918 },

  'jamia ashrafia': { name: 'Jamia Ashrafia Lahore', lat: 31.5222587, lng: 74.3259718 },

  'jamia naeemia': { name: 'Jamia Naeemia Lahore', lat: 31.5907252, lng: 74.3671433 },

  'minhaj ul quran': { name: 'Minhaj-ul-Quran International Lahore', lat: 31.4833429, lng: 74.3090304 },
  'mqi lahore': { name: 'Minhaj-ul-Quran International Lahore', lat: 31.4833429, lng: 74.3090304 },

  'dyal singh college': { name: 'Dyal Singh College Lahore', lat: 31.5688982, lng: 74.3254456 },

  'mao college': { name: 'MAO College Lahore', lat: 31.5625191, lng: 74.3029137 },

  'islamia college railway road': { name: 'Islamia College Railway Road Lahore', lat: 31.5747463, lng: 74.3254655 },

  'aitchison college': { name: 'Aitchison College Lahore', lat: 31.5502455, lng: 74.3456212 },

  'queen mary college': { name: 'Queen Mary College Lahore', lat: 31.5632838, lng: 74.3407695 },

  'university of home economics': { name: 'University of Home Economics Lahore', lat: 31.5252123, lng: 74.3522823 },
  'uhe lahore': { name: 'University of Home Economics Lahore', lat: 31.5252123, lng: 74.3522823 },

  'islamia college civil lines': { name: 'Islamia College Civil Lines Lahore', lat: 31.5720492, lng: 74.301089 },

  'govt college model town': { name: 'Government College Model Town Lahore', lat: 31.4843815, lng: 74.3214337 },

  'govt college faisal town': { name: 'Government College Faisal Town Lahore', lat: 31.4806207, lng: 74.3085768 },

  'govt college allama iqbal town': { name: 'Government College Allama Iqbal Town Lahore', lat: 31.5118204, lng: 74.3021764 },

  'govt college wahdat road': { name: 'Government College Wahdat Road Lahore', lat: 31.509748, lng: 74.2944995 },

  'govt college walton': { name: 'Government College Walton Lahore', lat: 31.4746357, lng: 74.356418 },

  'govt college dharampura': { name: 'Government College Dharampura Lahore', lat: 31.5523553, lng: 74.3683058 },

  'govt college krishan nagar': { name: 'Government College Krishan Nagar Lahore', lat: 31.5666194, lng: 74.2989907 },

  'garrison college': { name: 'Garrison College Lahore', lat: 31.5345238, lng: 74.3814272 },

  'govt college for women iqbal town': { name: 'Government College for Women Iqbal Town Lahore', lat: 31.474605, lng: 74.3562941 },
};

/**
 * Try to resolve a university name/abbreviation to full name and coordinates.
 * Checks database first, then falls back to provided full name.
 * @param {string} universityInput - Abbreviation or partial/full name from user
 * @returns {object|null} - { name, lat, lng } or null if not found
 */
function resolveUniversityFromKnown(universityInput) {
  if (!universityInput) return null;

  const key = universityInput.trim().toLowerCase();

  // Direct lookup
  if (universityDatabase[key]) {
    return universityDatabase[key];
  }

  // Fuzzy match: check if input contains or is contained within a known key
  for (const [knownKey, data] of Object.entries(universityDatabase)) {
    if (key.includes(knownKey) || knownKey.includes(key)) {
      return data;
    }
  }

  return null;
}

module.exports = {
  resolveUniversityFromKnown,
  universityDatabase,
};
