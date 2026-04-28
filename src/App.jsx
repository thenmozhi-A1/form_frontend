import React, { useState, useRef } from 'react'
import axios from 'axios'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import SignatureCanvas from 'react-signature-canvas'
import logoImage from '../public/logo.png'
import './App.css'

const App = () => {
  const componentRef = useRef(null);
  const sigCanvasRef = useRef(null);
  const execCanvasRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];

  const downloadPDF = async () => {
    const element = componentRef.current;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      windowWidth: 1200,
      onclone: (clonedDoc) => {
        // Hide the submit button in the PDF
        const submitBtn = clonedDoc.querySelector('.submit-section-final');
        if (submitBtn) submitBtn.style.display = 'none';

        const inputs = clonedDoc.querySelectorAll('input[type="text"], input[type="date"], input[type="email"]');
        inputs.forEach(input => {
          // Skip inputs that are meant to be hidden (opacity 0)
          if (window.getComputedStyle(input).opacity === '0') {
            input.style.display = 'none';
            return;
          }
          
          const span = clonedDoc.createElement('span');
          let displayValue = input.value;
          
          if (input.type === 'date' && displayValue) {
            const [y, m, d] = displayValue.split('-');
            displayValue = `${d}/${m}/${y}`;
          }
          
          span.innerText = displayValue;

          // Manually copy the most important styles
          const compStyle = clonedDoc.defaultView.getComputedStyle(input);
          span.style.fontFamily = compStyle.fontFamily;
          span.style.fontSize = compStyle.fontSize;
          span.style.fontWeight = compStyle.fontWeight;
          span.style.color = compStyle.color;
          span.style.textAlign = compStyle.textAlign;
          span.style.display = 'flex';
          span.style.alignItems = 'center';
          span.style.justifyContent = compStyle.textAlign === 'center' ? 'center' : (compStyle.textAlign === 'right' ? 'flex-end' : 'flex-start');
          span.style.width = compStyle.width;
          span.style.height = compStyle.height;
          span.style.borderBottom = compStyle.borderBottom;
          span.style.borderTop = compStyle.borderTop;
          span.style.borderLeft = compStyle.borderLeft;
          span.style.borderRight = compStyle.borderRight;
          span.style.backgroundColor = compStyle.backgroundColor;
          span.style.padding = compStyle.padding;
          span.style.margin = compStyle.margin;
          span.style.boxSizing = 'border-box';

          input.parentNode.replaceChild(span, input);
        });
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pdfWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    // Force fit to exactly 1 page vertically
    if (imgHeight > pdfHeight) {
      const scaleFactor = pdfHeight / imgHeight;
      const scaledWidth = imgWidth * scaleFactor;
      const xOffset = (pdfWidth - scaledWidth) / 2;
      pdf.addImage(imgData, 'JPEG', xOffset, 0, scaledWidth, pdfHeight);
    } else {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    }

    pdf.save('BY_Technologies_Order_Form.pdf');
  };

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

  const numberToWords = (amount) => {
    if (!amount || isNaN(amount)) return '';
    const num = parseInt(amount, 10);
    if (num === 0) return 'Zero';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + a[num % 10] : '');
    if (num < 1000) return a[Math.floor(num / 100)] + 'Hundred ' + (num % 100 !== 0 ? 'and ' + numberToWords(num % 100) : '');
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + 'Thousand ' + (num % 1000 !== 0 ? numberToWords(num % 1000) : '');
    if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + 'Lakh ' + (num % 100000 !== 0 ? numberToWords(num % 100000) : '');
    return numberToWords(Math.floor(num / 10000000)) + 'Crore ' + (num % 10000000 !== 0 ? numberToWords(num % 10000000) : '');
  };

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
    } else if (name === 'total') {
      const val = parseFloat(value) || 0;
      const gst = val * 0.18;
      const grand = val + gst;
      const words = value ? numberToWords(Math.round(grand)) + 'Rupees Only' : '';
      setFormData(prev => ({
        ...prev,
        total: value,
        gstAmount: value ? gst.toFixed(2) : '',
        grandTotal: value ? grand.toFixed(2) : '',
        paymentAmountWords: words
      }));
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
      // Save to Backend
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const response = await axios.post(`${backendUrl}/api/forms`, formData)
      console.log('Server Response:', response.data)

      alert('Data saved successfully to database!')

      // Trigger Automatic PDF Download
      downloadPDF();
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error saving data. Make sure backend is running.')
    }
  }

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className='page-container'>
      <div className="form-wrapper" ref={componentRef}>
        <header className="main-header">
          <div className="header-left">
            <div className="logo-section">
              <div className="logo-circle">
                <img src={logoImage} alt="logo" height={130} width={130} />
                <sup className="trademark">TM</sup>
              </div>
            </div>
            <div className="customer-support">
              <p className="support-title">Customer Support</p>
              <p>📞99410 70555</p>
              <p>☎️044-4314 1055</p>
            </div>
          </div>

          <div className="header-center">
            <h1 className="company-title">B&Y Technologies <sup style={{ fontSize: '12px' }}>TM</sup></h1>
            <p className="address-line">No:624, Anna Salai, 4th floor, khivraj building, Near Gemini Flyover</p>
            <p className="address-line">Chennai-600 006</p>
            <p className="contact-line">Website: www.bnytechnologies.com</p>
            <p className="contact-line">Email: info@bnytechnologies.com</p>
          </div>

          <div className="header-right">
            <div className="header-input-group">
              <label>Date :</label>
              <div style={{ position: 'relative', width: '200px' }}>
                <input
                  type="date"
                  name="date"
                  min={today}
                  value={formData.date}
                  onChange={handleChange}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                />
                <input
                  type="text"
                  readOnly
                  value={formatDateForDisplay(formData.date)}
                  placeholder="DD/MM/YYYY"
                  style={{
                    width: '100%',
                    padding: '5px',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}
                />
                <span style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  fontSize: '10px'
                }}>▼</span>
              </div>
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
              <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="line-input address-line-2-input" placeholder="Address Line 2" />
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
                          <span className={`fake-box ${formData.subscription.websiteSEO === val ? 'checked' : ''}`}>{formData.subscription.websiteSEO === val ? '✔' : ''}</span>
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
                          <span className={`fake-box ${formData.subscription.keywords === val ? 'checked' : ''}`}>{formData.subscription.keywords === val ? '✔' : ''}</span>
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
                <td className="text-center no-v" rowSpan="3" style={{ verticalAlign: 'top', paddingTop: '10px' }}>4</td>
                <td colSpan="2" className="no-v" rowSpan="3" style={{ verticalAlign: 'top', paddingBottom: '20px' }}>
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
                          <span className={`fake-box ${formData.subscription.additionalPlans.includes(plan) ? 'checked' : ''}`}>{formData.subscription.additionalPlans.includes(plan) ? '✔' : ''}</span>
                          <span className="box-input-label">{plan}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="summary-label">Total</td>
                <td className="summary-val-col" style={{ position: 'relative', height: '30px' }}>
                  <input type="text" name="total" value={formData.total} onChange={handleChange} className="summary-input" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '100%' }} />
                </td>
              </tr>

              {/* Summary Bottom Rows */}
              <tr style={{ height: '30px' }}>
                <td className="summary-label">GST</td>
                <td className="summary-val-col" style={{ position: 'relative' }}>
                  <input type="text" name="gstAmount" value={formData.gstAmount} onChange={handleChange} className="summary-input" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '100%' }} />
                </td>
              </tr>
              <tr style={{ height: '30px' }}>
                <td className="summary-label grand-total">Grand Total</td>
                <td className="summary-val-col" style={{ position: 'relative' }}>
                  <input type="text" name="grandTotal" value={formData.grandTotal} onChange={handleChange} className="summary-input" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '100%' }} />
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
                          <span className={`fake-box ${formData.paymentMode === mode ? 'checked' : ''}`}>{formData.paymentMode === mode ? '✔' : ''}</span>
                          <span className="box-input-label">{mode}</span>
                        </label>
                      ))}
                    </div>
                    <div className="cheque-date-field">
                      <span className="bold-label">Cheque Date :</span>
                      <div style={{ position: 'relative', width: '150px', display: 'inline-block', verticalAlign: 'middle' }}>
                        <input
                          type="date"
                          name="chequeDate"
                          min={today}
                          value={formData.chequeDate}
                          onChange={handleChange}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer',
                            zIndex: 2
                          }}
                        />
                        <input
                          type="text"
                          readOnly
                          value={formatDateForDisplay(formData.chequeDate)}
                          placeholder="DD/MM/YYYY"
                          className="bottom-line-input"
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            pointerEvents: 'none',
                            zIndex: 1
                          }}
                        />
                        <span style={{ 
                          position: 'absolute', 
                          right: '5px', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                          fontSize: '10px'
                        }}>▼</span>
                      </div>
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
                <ul className="footer-note-list" style={{ listStyleType: 'none' }}>
                  <li>o Cheque/ Draft to be made in favor of "B & Y Technologies"</li>
                  <li>o PAN NO : AKQPY8114R    GSTIN No : 33AKQPY8114R1Z3</li>
                  <li>o Kindly refer terms & Conditions Overleaf</li>
                </ul>
                <ul className="footer-note-list" style={{ listStyleType: 'none' }}>
                  <li>o E & O.E</li>
                  <li>o All disputes are subjected to Chennai Jurisdiction</li>
                  <li>o As Proposed in budget</li>
                </ul>
              </div>
            </div>
            <div style={{ borderTop: '1px solid black', marginTop: '15px', paddingTop: '10px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: '#222' }}>
              Note : B & Y Technologies is committed to deliver only services printed in this Performa, any manual alteration need prior approval
            </div>
          </div>
        </footer>


        <div className="submit-section-final">
          <button type="submit" onClick={handleSubmit} className="btn-submit-pro">Submit Form</button>
        </div>
      </div >
    </div >
  )
}

export default App


