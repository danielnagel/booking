import bcrypt from 'bcrypt';
import pool from '../db/pool.js';

const BCRYPT_ROUNDS = 10;
const DEMO_USERNAME = 'demo';
const DEMO_PASSWORD = 'demo';

// Fictional, without any real-world reference - this data is only ever
// inserted into the public demo system (see backend/src/routes/bookings.js
// and auth.js, gated on MODE=demo).
const DEMO_BOOKINGS = [
  { event_name: 'Sommerfest Musterstadt', event_date: '2026-06-13', organizer: 'The Placeholder Kings', organizer_website: 'https://placeholder-kings.example', organizer_email: 'booking@placeholder-kings.example', application_text: 'Wir würden gerne beim Sommerfest spielen, ca. 90 Minuten Programm.', venue_street: 'Beispielweg 1', venue_zip: '12345', venue_city: 'Musterstadt', fee: '450.00', status: 'angenommen', contact_person: 'Anna Beispiel', organizer_phone: '+49 151 00000001', organizer_facebook: 'https://facebook.example/placeholderkings', organizer_instagram: 'https://instagram.example/placeholderkings', last_contact_date: '2026-03-02', notes: 'Backline wird gestellt.' },
  { event_name: 'Frühlingsfestival Beispielhausen', event_date: '2026-04-25', organizer: 'Sonic Fictionals', organizer_website: 'https://sonic-fictionals.example', organizer_email: 'info@sonic-fictionals.example', application_text: 'Bewerbung für einen Slot am Samstagabend.', venue_street: 'Musterallee 22', venue_zip: '23456', venue_city: 'Beispielhausen', fee: '300.00', status: 'offen', contact_person: 'Ben Mustermann', organizer_phone: '+49 151 00000002', organizer_facebook: '', organizer_instagram: 'https://instagram.example/sonicfictionals', last_contact_date: '2026-02-10', notes: '' },
  { event_name: 'Herbstkonzert Fiktivdorf', event_date: '2026-10-03', organizer: 'Café Testklang', organizer_website: 'https://testklang.example', organizer_email: 'kontakt@testklang.example', application_text: 'Anfrage für ein Akustik-Set im Rahmen der Herbstreihe.', venue_street: 'Probeplatz 3', venue_zip: '34567', venue_city: 'Fiktivdorf', fee: '180.00', status: 'angenommen', contact_person: 'Clara Fiktiv', organizer_phone: '+49 151 00000003', organizer_facebook: 'https://facebook.example/testklang', organizer_instagram: '', last_contact_date: '2026-05-01', notes: 'Nur akustisch, kein PA-System vorhanden.' },
  { event_name: 'Stadtfest Beispielburg', event_date: '2026-07-18', organizer: 'Die Namenlosen', organizer_website: '', organizer_email: 'die.namenlosen@example.com', application_text: 'Bewerbung für die Hauptbühne am Samstag.', venue_street: 'Rathausplatz 5', venue_zip: '45678', venue_city: 'Beispielburg', fee: '600.00', status: 'abgelehnt', contact_person: 'Dennis Probe', organizer_phone: '+49 151 00000004', organizer_facebook: 'https://facebook.example/dienamenlosen', organizer_instagram: 'https://instagram.example/dienamenlosen', last_contact_date: '2026-04-14', notes: 'Termin bereits vergeben.' },
  { event_name: 'Kneipentour Testburg', event_date: '2026-09-12', organizer: 'Fictitious Folk', organizer_website: 'https://fictitious-folk.example', organizer_email: 'booking@fictitious-folk.example', application_text: 'Wir spielen gerne im Rahmen der Kneipentour.', venue_street: 'Alte Gasse 8', venue_zip: '56789', venue_city: 'Testburg', fee: '220.00', status: 'offen', contact_person: 'Eva Testfrau', organizer_phone: '+49 151 00000005', organizer_facebook: '', organizer_instagram: '', last_contact_date: '', notes: '' },
  { event_name: 'Winterball Musterhausen', event_date: '2026-12-05', organizer: 'Dummy Data Orchestra', organizer_website: 'https://dummydata-orchestra.example', organizer_email: 'management@dummydata-orchestra.example', application_text: 'Anfrage für den Winterball, Tanzmusik-Set gewünscht.', venue_street: 'Ballsaalstraße 10', venue_zip: '67890', venue_city: 'Musterhausen', fee: '750.00', status: 'angenommen', contact_person: 'Frank Vorlage', organizer_phone: '+49 151 00000006', organizer_facebook: 'https://facebook.example/dummydataorchestra', organizer_instagram: 'https://instagram.example/dummydataorchestra', last_contact_date: '2026-06-20', notes: 'Sekt-Empfang vorab eingeplant.' },
  { event_name: 'Open Air Probeweiler', event_date: '2026-08-08', organizer: 'The Sample Set', organizer_website: '', organizer_email: 'thesampleset@example.com', application_text: 'Wir bewerben uns für einen Open-Air-Slot.', venue_street: 'Wiesenweg 2', venue_zip: '78901', venue_city: 'Probeweiler', fee: '350.00', status: 'storniert', contact_person: 'Greta Musterfrau', organizer_phone: '+49 151 00000007', organizer_facebook: '', organizer_instagram: 'https://instagram.example/thesampleset', last_contact_date: '2026-05-15', notes: 'Veranstaltung witterungsbedingt abgesagt.' },
  { event_name: 'Jubiläumsfeier Beispielverein', event_date: '2026-05-30', organizer: 'Lorem Ipsum Band', organizer_website: 'https://loremipsum-band.example', organizer_email: 'anfragen@loremipsum-band.example', application_text: 'Bewerbung für die 25-Jahr-Feier des Vereins.', venue_street: 'Vereinsheimweg 4', venue_zip: '89012', venue_city: 'Beispielverein', fee: '400.00', status: 'angenommen', contact_person: 'Hannes Testmann', organizer_phone: '+49 151 00000008', organizer_facebook: 'https://facebook.example/loremipsumband', organizer_instagram: '', last_contact_date: '2026-03-18', notes: '' },
  { event_name: 'Bandcontest Fiktivstadt', event_date: '2026-11-14', organizer: 'Placeholder Collective', organizer_website: 'https://placeholder-collective.example', organizer_email: 'contest@placeholder-collective.example', application_text: 'Teilnahme am jährlichen Bandcontest.', venue_street: 'Jugendhausstraße 6', venue_zip: '90123', venue_city: 'Fiktivstadt', fee: '0.00', status: 'offen', contact_person: 'Ina Beispielhaft', organizer_phone: '+49 151 00000009', organizer_facebook: '', organizer_instagram: 'https://instagram.example/placeholdercollective', last_contact_date: '', notes: 'Kein Honorar, Gewinn ist Studiozeit.' },
  { event_name: 'Kulturnacht Testheim', event_date: '2026-09-26', organizer: 'Fake News Quartet', organizer_website: 'https://fakenews-quartet.example', organizer_email: 'quartet@fakenews.example', application_text: 'Bewerbung für einen Programmpunkt der Kulturnacht.', venue_street: 'Kulturhausplatz 9', venue_zip: '10123', venue_city: 'Testheim', fee: '280.00', status: 'angenommen', contact_person: 'Jonas Attrappe', organizer_phone: '+49 151 00000010', organizer_facebook: 'https://facebook.example/fakenewsquartet', organizer_instagram: 'https://instagram.example/fakenewsquartet', last_contact_date: '2026-07-01', notes: '' },
  { event_name: 'Weinfest Probach', event_date: '2026-09-05', organizer: 'Mock Data Trio', organizer_website: '', organizer_email: 'mockdatatrio@example.com', application_text: 'Anfrage für Live-Musik zum Weinfest.', venue_street: 'Weinbergstraße 11', venue_zip: '21234', venue_city: 'Probach', fee: '260.00', status: 'offen', contact_person: 'Karin Scheinbar', organizer_phone: '+49 151 00000011', organizer_facebook: '', organizer_instagram: '', last_contact_date: '2026-06-11', notes: '' },
  { event_name: 'Firmenfeier Beispiel GmbH', event_date: '2026-06-27', organizer: 'Synthetic Sounds', organizer_website: 'https://synthetic-sounds.example', organizer_email: 'booking@synthetic-sounds.example', application_text: 'Anfrage für Hintergrundmusik bei einer Firmenfeier.', venue_street: 'Gewerbepark 14', venue_zip: '32345', venue_city: 'Beispielstadt', fee: '500.00', status: 'abgelehnt', contact_person: 'Lars Fingiert', organizer_phone: '+49 151 00000012', organizer_facebook: 'https://facebook.example/syntheticsounds', organizer_instagram: '', last_contact_date: '2026-04-30', notes: 'Budget überschritten.' },
  { event_name: 'Stadtparkfest Probehausen', event_date: '2026-07-04', organizer: 'The Dummy Riders', organizer_website: 'https://dummyriders.example', organizer_email: 'ride@dummyriders.example', application_text: 'Bewerbung für die Bühne im Stadtpark.', venue_street: 'Parkallee 16', venue_zip: '43456', venue_city: 'Probehausen', fee: '320.00', status: 'angenommen', contact_person: 'Mara Testweise', organizer_phone: '+49 151 00000013', organizer_facebook: '', organizer_instagram: 'https://instagram.example/dummyriders', last_contact_date: '2026-05-22', notes: '' },
  { event_name: 'Adventsmarkt Musterfeld', event_date: '2026-12-13', organizer: 'Chorprobe Fiktiv', organizer_website: '', organizer_email: 'chorprobe.fiktiv@example.com', application_text: 'Anfrage für einen Adventssingauftritt.', venue_street: 'Marktplatz 2', venue_zip: '54567', venue_city: 'Musterfeld', fee: '150.00', status: 'offen', contact_person: 'Niklas Beispielig', organizer_phone: '+49 151 00000014', organizer_facebook: '', organizer_instagram: '', last_contact_date: '', notes: '' },
  { event_name: 'Vereinsjubiläum Testdorf', event_date: '2026-05-09', organizer: 'Placeholder Brass Band', organizer_website: 'https://placeholder-brass.example', organizer_email: 'brass@placeholder-brass.example', application_text: 'Bewerbung für das Vereinsjubiläum mit Blasmusik.', venue_street: 'Festwiese 3', venue_zip: '65678', venue_city: 'Testdorf', fee: '380.00', status: 'angenommen', contact_person: 'Olga Attrappenfeld', organizer_phone: '+49 151 00000015', organizer_facebook: 'https://facebook.example/placeholderbrass', organizer_instagram: '', last_contact_date: '2026-02-27', notes: '' },
  { event_name: 'Clubnacht Fiktivhafen', event_date: '2026-10-24', organizer: 'Sample Rate Sisters', organizer_website: 'https://samplerate-sisters.example', organizer_email: 'sisters@samplerate.example', application_text: 'Bewerbung als Support-Act für die Clubnacht.', venue_street: 'Hafenstraße 7', venue_zip: '76789', venue_city: 'Fiktivhafen', fee: '200.00', status: 'storniert', contact_person: 'Paul Erdacht', organizer_phone: '+49 151 00000016', organizer_facebook: 'https://facebook.example/sampleratesisters', organizer_instagram: 'https://instagram.example/sampleratesisters', last_contact_date: '2026-08-01', notes: 'Club hat kurzfristig geschlossen.' },
  { event_name: 'Schlossparkfestival Beispielau', event_date: '2026-08-22', organizer: 'Null Eins Zwei', organizer_website: 'https://nulleinszwei.example', organizer_email: 'booking@nulleinszwei.example', application_text: 'Anfrage für einen Nachmittagsslot im Schlosspark.', venue_street: 'Schlossgarten 1', venue_zip: '87890', venue_city: 'Beispielau', fee: '340.00', status: 'offen', contact_person: 'Quirin Testfeld', organizer_phone: '+49 151 00000017', organizer_facebook: '', organizer_instagram: '', last_contact_date: '2026-06-05', notes: '' },
  { event_name: 'Streetfoodfestival Musterbrück', event_date: '2026-06-06', organizer: 'Fiktive Frequenzen', organizer_website: 'https://fiktive-frequenzen.example', organizer_email: 'kontakt@fiktive-frequenzen.example', application_text: 'Bewerbung für musikalische Begleitung des Streetfoodfestivals.', venue_street: 'Marktbrücke 5', venue_zip: '98901', venue_city: 'Musterbrück', fee: '270.00', status: 'angenommen', contact_person: 'Rosa Scheinfeld', organizer_phone: '+49 151 00000018', organizer_facebook: 'https://facebook.example/fiktivefrequenzen', organizer_instagram: 'https://instagram.example/fiktivefrequenzen', last_contact_date: '2026-04-08', notes: '' },
  { event_name: 'Gemeindefest Testau', event_date: '2026-07-11', organizer: 'Trockenlauf Trio', organizer_website: '', organizer_email: 'trockenlauf.trio@example.com', application_text: 'Anfrage für Live-Musik beim Gemeindefest.', venue_street: 'Dorfplatz 6', venue_zip: '19012', venue_city: 'Testau', fee: '190.00', status: 'offen', contact_person: 'Stefan Musterig', organizer_phone: '+49 151 00000019', organizer_facebook: '', organizer_instagram: '', last_contact_date: '', notes: '' },
  { event_name: 'Silvesterparty Fiktivburg', event_date: '2026-12-31', organizer: 'Countdown Fictionals', organizer_website: 'https://countdown-fictionals.example', organizer_email: 'party@countdown-fictionals.example', application_text: 'Bewerbung für die Silvesterparty, DJ-Set plus Liveband.', venue_street: 'Neujahrsplatz 12', venue_zip: '29123', venue_city: 'Fiktivburg', fee: '650.00', status: 'angenommen', contact_person: 'Tina Beispielhaus', organizer_phone: '+49 151 00000020', organizer_facebook: 'https://facebook.example/countdownfictionals', organizer_instagram: 'https://instagram.example/countdownfictionals', last_contact_date: '2026-09-30', notes: 'Aufbau bereits ab 16 Uhr möglich.' },
];

async function seedDemoUser() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  await pool.query(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [DEMO_USERNAME, passwordHash],
  );
}

async function seedDemoBookings() {
  const { rows } = await pool.query('SELECT COUNT(*) AS count FROM bookings');
  if (Number.parseInt(rows[0].count, 10) > 0) return;

  for (const booking of DEMO_BOOKINGS) {
    const columns = Object.keys(booking);
    const values = columns.map((column) => booking[column] || null);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    await pool.query(
      `INSERT INTO bookings (${columns.join(', ')}, created_by)
       VALUES (${placeholders.join(', ')}, $${columns.length + 1})`,
      [...values, DEMO_USERNAME],
    );
  }
}

async function main() {
  await seedDemoUser();
  await seedDemoBookings();
  console.log(`Demo-Benutzer "${DEMO_USERNAME}" und ${DEMO_BOOKINGS.length} Beispieleinträge sind vorhanden.`);
}

main()
  .catch((error) => {
    console.error('Fehler beim Anlegen der Demo-Daten:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
