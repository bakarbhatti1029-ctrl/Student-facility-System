const PDFDocument = require('pdfkit');

// Builds a one-page A4 booking receipt and resolves it as a Buffer, ready to
// upload to Cloudinary or attach to an email — no disk I/O involved.
function generateInvoicePdf({ student, hostel, room, bed, booking, paymentIntentId }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).font('Helvetica-Bold').text('Student Facility System', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#555').text('Hostel Booking Receipt', { align: 'center' });
    doc.moveDown(1.5);
    doc.fillColor('#000');

    doc.fontSize(10).font('Helvetica')
      .text(`Receipt No: ${booking._id}`)
      .text(`Issued: ${new Date().toLocaleString()}`);
    doc.moveDown(1);

    const section = (title) => {
      doc.moveDown(0.5);
      doc.fontSize(13).font('Helvetica-Bold').text(title);
      doc.moveTo(doc.x, doc.y + 2).lineTo(545, doc.y + 2).strokeColor('#ccc').stroke();
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
    };

    section('Student Details');
    doc.text(`Name: ${student.first_name} ${student.last_name}`);
    doc.text(`Email: ${student.email}`);
    doc.text(`Phone: ${student.phone_number}`);
    doc.text(`CNIC: ${student.cnic}`);

    section('Hostel Details');
    doc.text(`Hostel: ${hostel.hostel_name}`);
    doc.text(`Address: ${hostel.hostel_address}`);
    doc.text(`Owner: ${hostel.first_name} ${hostel.last_name}`);
    doc.text(`Owner Phone: ${hostel.phone_number}`);

    section('Booking Details');
    doc.text(`Room: ${room.name}`);
    doc.text(`Bed Number: ${bed.bed_number}`);
    doc.text(`Booking Date: ${new Date(booking.booking_date).toLocaleString()}`);

    section('Payment Details');
    doc.text(`Amount Paid: PKR ${room.price}`);
    doc.text(`Payment Reference: ${paymentIntentId || 'N/A'}`);
    doc.fillColor('#16a34a').font('Helvetica-Bold').text('Status: PAID');
    doc.fillColor('#000').font('Helvetica');

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#777')
      .text('This receipt confirms your bed booking and payment. Please present it to the hostel owner on arrival if requested.', {
        align: 'center',
      });

    doc.end();
  });
}

module.exports = generateInvoicePdf;
