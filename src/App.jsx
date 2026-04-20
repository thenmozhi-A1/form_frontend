import React, { useState, useRef } from 'react'
import axios from 'axios'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import SignatureCanvas from 'react-signature-canvas'
import './App.css'

const App = () => {
  const componentRef = useRef(null);
  const sigCanvasRef = useRef(null);
  const execCanvasRef = useRef(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    date: '',
    city: '',
    companyName: '',
    address: '',
    addressLine2: '',
    contactPerson: '',
    pinCode: '',
    emailId: '',
    phone: '',
    gst: '',
    total: '',
    gstAmount: '',
    grandTotal: '',
    domainName: '',
    amountReceived: '',
    amountBalance: '',
    paymentAmountWords: '',
    bankName: '',
    chequeNumber: '',
    chequeDate: '',
    subscription: {
      websiteSEO: '',
      keywords: '',
      additionalPlans: []
    },
    paymentMode: '',
    customerSig: '',
    executiveSig: ''
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      const { additionalPlans } = formData.subscription
      let updatedPlans = [...additionalPlans]
      if (checked) {
        updatedPlans.push(value)
      } else {
        updatedPlans = updatedPlans.filter(plan => plan !== value)
      }
      setFormData(prev => ({
        ...prev,
        subscription: {
          ...prev.subscription,
          additionalPlans: updatedPlans
        }
      }))
    } else if (name === 'websiteSEO' || name === 'keywords') {
      setFormData(prev => ({
        ...prev,
        subscription: {
          ...prev.subscription,
          [name]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      console.log('Submitting Form Data:', formData)
      // Save to Backend using the computer's Local IP so mobile devices can access it
      const response = await axios.post('http://192.168.1.23:8080/api/forms', formData)
      console.log('Server Response:', response.data)

      alert('Data saved successfully to database!')

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error saving data. Make sure backend is running.')
    }
  }

  const handleDownloadPDF = () => {
    const element = componentRef.current;

    // Temporarily hide clear buttons before generating PDF
    const clearButtons = element.querySelectorAll('.btn-clear, button');
    clearButtons.forEach(btn => btn.style.display = 'none');

    // CRITICAL FIX: To prevent html2canvas' famous font-squishing bug inside input tags,
    // we temporarily replace all text inputs with styled spans containing their text content!
    const textInputs = element.querySelectorAll('input[type="text"], input[type="email"], input[type="date"], textarea');
    const swapped = [];
    textInputs.forEach(input => {
      const span = document.createElement('span');
      span.innerText = input.value || '';
      span.className = input.className;

      // Copy critical computed styles for an exact visual match
      const comp = window.getComputedStyle(input);
      span.style.cssText = comp.cssText;
      span.style.border = comp.border;
      span.style.borderBottom = comp.borderBottom;
      span.style.display = 'inline-block';
      span.style.height = comp.height;
      span.style.minHeight = comp.minHeight;

      input.parentNode.insertBefore(span, input);
      input.style.display = 'none'; // Hide actual input
      swapped.push({ input, span });
    });

    // Handle checkboxes and radios standardly
    const boxInputs = element.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    boxInputs.forEach(input => {
      if (input.checked) input.setAttribute('checked', 'checked');
      else input.removeAttribute('checked');
    });

    // Add useCORS: true to fetch the external logo correctly
    html2canvas(element, { scale: 2, windowWidth: 1000, useCORS: true, allowTaint: true }).then((canvas) => {
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Setup standard A4 portrait PDF format
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Find ratio to shrink the total snapshot into precisely 1 page logic
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;

      // Maximum constraint (leaves a 4mm margin top/bottom)
      const fitHeight = Math.min(finalHeight, pdfHeight - 8);
      const fitWidth = imgWidth * (fitHeight / imgHeight);
      const fitMarginX = (pdfWidth - fitWidth) / 2;

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', fitMarginX, 4, fitWidth, fitHeight); // Add precisely within constraints
      pdf.save(`order_form_${formData.companyName || 'bny'}.pdf`);

      // RESTORE EVERYTHING immediately
      clearButtons.forEach(btn => btn.style.display = 'inline-block');
      swapped.forEach(item => {
        item.input.style.display = ''; // reveal input
        item.span.parentNode.removeChild(item.span); // remove fake span
      });
    });
  }

  return (
    <div className='page-container'>
      <div className="form-wrapper" ref={componentRef}>
        <header className="main-header">
          <div className="header-left">
            <div className="logo-section">
              <div className="logo-circle">
                <img src="/bny-logo.png" alt="logo" height={130} width={130} />
                <sup className="trademark">TM</sup>
              </div>
            </div>
            <div className="customer-support">
              <p className="support-title">Customer Support</p>
              <p>📞 99410 70555</p>
              <p>☎️ 044-4314 1055</p>
            </div>
          </div>

          <div className="header-center">
            <h1 className="company-title">B&Y Technologies™</h1>
            <p className="address-line">No:624, Anna Salai, 4th floor, khivraj building, Near Gemini Flyover</p>
            <p className="address-line">Chennai-600 006</p>
            <p className="contact-line">Website: www.bnytechnologies.com</p>
            <p className="contact-line">Email: info@bnytechnologies.com</p>
          </div>

          <div className="header-right">
            <div className="header-input-group">
              <label>Date :</label>
              <input type="text" name="date" placeholder="DD/MM/YYYY" value={formData.date} onChange={handleChange} />
            </div>
            <div className="header-input-group">
              <label>City :</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} />
            </div>
          </div>
        </header>

        <section className="customer-info-section">
          <div className="customer-row">
            <span className="bold-label">Company Name ( IN BLOCK LETTERS ) :</span>
            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="line-input" />
          </div>
          <div className="customer-row">
            <span className="bold-label">Address :</span>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="line-input" />
          </div>
          {/* Row 3: Address Line 2 & Pin Code */}
          <div className="customer-grid">
            <div className="customer-row" style={{ flex: 1.5 }}>
              <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="line-input" style={{ marginLeft: '75px' }} />
            </div>
            <div className="customer-row">
              <span className="bold-label">Pin Code :</span>
              <input type="text" name="pinCode" value={formData.pinCode} onChange={handleChange} className="line-input" />
            </div>
          </div>

          {/* Row 4: Contact Person & Phone */}
          <div className="customer-grid">
            <div className="customer-row" style={{ flex: 1.5 }}>
              <span className="bold-label">Contact Person ( Mr/Mrs ) :</span>
              <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="line-input" />
            </div>
            <div className="customer-row">
              <span className="bold-label">Phone :</span>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="line-input" />
            </div>
          </div>

          {/* Row 5: Email Id & GST */}
          <div className="customer-grid">
            <div className="customer-row" style={{ flex: 1.5 }}>
              <span className="bold-label">Email Id :</span>
              <input type="email" name="emailId" value={formData.emailId} onChange={handleChange} className="line-input" />
            </div>
            <div className="customer-row">
              <span className="bold-label">GST :</span>
              <input type="text" name="gst" value={formData.gst} onChange={handleChange} className="line-input" />
            </div>
          </div>
        </section>


        <section className="subscription-section">
          <table className="form-table">
            <thead>
              <tr>
                <th style={{ width: '35px' }}>S.No</th>
                <th colSpan="2">Subscription</th>
                <th style={{ width: '130px' }}>Price (Rs)</th>
                <th style={{ width: '130px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1 - Website SEO */}
              <tr>
                <td className="text-center no-bottom">1</td>
                <td colSpan="2" className="no-bottom">
                  <div className="row-content">
                    <span className="item-label">Website & SEO</span>
                    <div className="options-grid">
                      {['Bronze', 'Silver', 'Gold', 'Platinum'].map(val => (
                        <label key={val} className="box-input">
                          <input type="radio" name="websiteSEO" value={val} checked={formData.subscription.websiteSEO === val} onChange={handleChange} />
                          <span className="fake-box"></span>
                          <span className="box-input-label">{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </td>
                <td rowSpan="3">
                  <input type="text" className="summary-input tall-input" />
                </td>
                <td rowSpan="3">
                  <input type="text" className="summary-input tall-input" />
                </td>
              </tr>

              {/* Row 2 - Keywords */}
              <tr>
                <td className="text-center no-v">2</td>
                <td colSpan="2" className="no-v">
                  <div className="row-content horizontal">
                    <span className="item-label">No. of Keywords</span>
                    <div className="options-row">
                      {['Limited', 'UnLimited'].map(val => (
                        <label key={val} className="box-input">
                          <input type="radio" name="keywords" value={val} checked={formData.subscription.keywords === val} onChange={handleChange} />
                          <span className="fake-box"></span>
                          <span className="box-input-label">{val}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>

              {/* Row 3 - Domain Name */}
              <tr>
                <td className="text-center no-v">3</td>
                <td colSpan="2" className="no-v">
                  <div className="row-content domain-row">
                    <span className="item-label">Domain Name</span>
                    <input type="text" name="domainName" value={formData.domainName} onChange={handleChange} className="boxed-input" />
                  </div>
                </td>
              </tr>

              {/* Row 4 - Additional Plans + Total Row */}
              <tr>
                <td className="text-center no-v" rowSpan="4" style={{ verticalAlign: 'top', paddingTop: '10px' }}>4</td>
                <td colSpan="2" className="no-v" rowSpan="4" style={{ verticalAlign: 'top', paddingBottom: '20px' }}>
                  <div className="row-content">
                    <span className="item-label">Additional Plans</span>
                    <div className="additional-plans-grid">
                      {[
                        'SEO,SEM,SMO', 'FB,Twitter,Instagram',
                        'Dynamic Websites', 'E-commerce Websites',
                        'YouTube Promotion', 'Mobile Applications',
                        'E-mail Marketing'
                      ].map(plan => (
                        <label key={plan} className="box-input">
                          <input type="checkbox" value={plan} checked={formData.subscription.additionalPlans.includes(plan)} onChange={handleChange} />
                          <span className="fake-box"></span>
                          <span className="box-input-label">{plan}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="summary-label">Total</td>
                <td className="summary-val-col">
                  <input type="text" name="total" value={formData.total} onChange={handleChange} className="summary-input" />
                </td>
              </tr>

              {/* Summary Bottom Rows */}
              <tr>
                <td className="summary-label">GST</td>
                <td className="summary-val-col">
                  <input type="text" name="gstAmount" value={formData.gstAmount} onChange={handleChange} className="summary-input" />
                </td>
              </tr>
              <tr>
                <td className="summary-label grand-total">Grand Total</td>
                <td className="summary-val-col">
                  <input type="text" name="grandTotal" value={formData.grandTotal} onChange={handleChange} className="summary-input" />
                </td>
              </tr>
              <tr>
                <td className="summary-label">
                  <input type="text" className="summary-input" />
                </td>
                <td className="summary-val-col">
                  <input type="text" className="summary-input" />
                </td>
              </tr>



              <tr>
                <td colSpan="5" className="amount-words-row">
                  <div className="inline-row p-10">
                    <span className="bold-label">Payment Amount (In Words) :</span>
                    <input type="text" name="paymentAmountWords" value={formData.paymentAmountWords} onChange={handleChange} className="bottom-line-input" />
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan="5">
                  <div className="payment-mode-section">
                    <div className="modes">
                      {['By Cheque', 'By Cash', 'By Gpay', 'Paypal', 'By Neft'].map(mode => (
                        <label key={mode} className="box-input">
                          <input type="radio" name="paymentMode" value={mode} checked={formData.paymentMode === mode} onChange={handleChange} />
                          <span className="fake-box"></span>
                          <span className="box-input-label">{mode}</span>
                        </label>
                      ))}
                    </div>
                    <div className="cheque-date-field">
                      <span className="bold-label">Cheque Date :</span>
                      <input type="text" name="chequeDate" placeholder="DD/MM/YYYY" value={formData.chequeDate} onChange={handleChange} className="bottom-line-input" />
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan="2">
                  <div className="inline-row p-10">
                    <span className="bold-label">Bank Name :</span>
                    <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="bottom-line-input" />
                  </div>
                </td>
                <td colSpan="3">
                  <div className="inline-row p-10">
                    <span className="bold-label">Cheque Number :</span>
                    <input type="text" name="chequeNumber" value={formData.chequeNumber} onChange={handleChange} className="bottom-line-input" />
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan="2">
                  <div className="inline-row p-10">
                    <span className="bold-label">Amount Received :</span>
                    <input type="text" name="amountReceived" value={formData.amountReceived} onChange={handleChange} className="bottom-line-input" />
                  </div>
                </td>
                <td colSpan="3">
                  <div className="inline-row p-10">
                    <span className="bold-label">Amount Balance :</span>
                    <input type="text" name="amountBalance" value={formData.amountBalance} onChange={handleChange} className="bottom-line-input" />
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan="5" className="terms-container">
                  <div className="note-box">
                    <p className="note-underline">Note:</p>
                    <ul className="terms-list-simple">
                      <li>This is application for B & Y Technologies web services. An order will be done on phone / email before booking the order.</li>
                      <li>All Services are for One Year duration only, unless specified otherwise.</li>
                      <li>All information including text & pictures to be provided by the client who should also be legal copyright owner for the same.</li>
                      <li>B & Y Technologies shall not be liable for any claims/damages arising out of content posted on your server.</li>
                      <li>Charges for subsequent years shall be as per the present rate, which may be higher than current charges.</li>
                      <li>Work on services shall commence only after clearance of cheque / pay order</li>
                      <li>All services are offered without any performance guarantee in terms of no. Queries, confirmed orders etc..</li>
                      <li>Pursuant to the signing of the invoice, I hereby allow B & Y Technologies to make commercial calls to my mobile number & organizations contact numbers. This declaration with hold valid even if I Choose to get my numbers registered for NDNC at any future date.</li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer className="final-footer">
          <section className="signature-section">
            <div className="sig-item">
              <div style={{ border: '1px dashed #7ea3ff', borderRadius: '8px', background: 'rgba(255,255,255,0.5)', marginBottom: '5px' }}>
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor='black'
                  canvasProps={{ width: 250, height: 80, className: 'sigCanvas' }}
                />
              </div>
              <button
                type="button"
                onClick={() => sigCanvasRef.current.clear()}
                style={{ fontSize: '11px', padding: '3px 8px', marginBottom: '5px', borderRadius: '5px', border: '1px solid #7ea3ff', background: '#fff', cursor: 'pointer' }}
              >Clear</button>
              <p className="sig-text">Customer's Signature & Stamp</p>
            </div>
            <div className="sig-item">
              <div style={{ border: '1px dashed #7ea3ff', borderRadius: '8px', background: 'rgba(255,255,255,0.5)', marginBottom: '5px' }}>
                <SignatureCanvas
                  ref={execCanvasRef}
                  penColor='black'
                  canvasProps={{ width: 250, height: 80, className: 'sigCanvas' }}
                />
              </div>
              <button
                type="button"
                onClick={() => execCanvasRef.current.clear()}
                style={{ fontSize: '11px', padding: '3px 8px', marginBottom: '5px', borderRadius: '5px', border: '1px solid #7ea3ff', background: '#fff', cursor: 'pointer' }}
              >Clear</button>
              <p className="sig-text">Signature Executive</p>
            </div>
          </section>

          <div className="footer-metadata-wrapper">
            <div className="metadata-container">
              <span className="note-label">Note :</span>
              <div className="metadata-grid">
                <ul className="footer-note-list">
                  <li>○ Cheque/ Draft to be made in favor of "B & Y Technologies"</li>
                  <li>○ PAN NO : AKQPY8114R    GSTIN No : 33AKQPY8114R1Z3</li>
                  <li>○ Kindly refer terms & Conditions Overleaf</li>
                </ul>
                <ul className="footer-note-list">
                  <li>○ E & O.E</li>
                  <li>○ All disputes are subjected to Chennai Jurisdiction</li>
                  <li>○ As Proposed in budget</li>
                </ul>
              </div>
            </div>
          </div>
        </footer>



        <div className="submit-section-final no-print" style={{ textAlign: 'center', padding: '20px' }}>
          {!isSubmitted ? (
            <button type="submit" onClick={handleSubmit} className="btn-submit-pro">Submit Form</button>
          ) : (
            <button type="button" onClick={handleDownloadPDF} className="btn-submit-pro" style={{ background: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' }}>Download as PDF</button>
          )}
        </div>
      </div >
    </div >
  )
}

export default App


