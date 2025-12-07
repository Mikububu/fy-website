/**
 * ForbiddenYoga WhatsApp Contact Handler
 * Shows QR code on desktop, opens WhatsApp directly on mobile
 */

(function() {
    'use strict';

    // Configuration - This will be set by the operator
    // The phone number should be in international format without + or spaces
    // Example: 1234567890 for a number
    const WHATSAPP_CONFIG = {
        phoneNumber: '', // Will be populated from data attribute or env
        message: 'Hello, I am interested in ForbiddenYoga services.',
        qrSize: 256
    };

    // Detect if user is on mobile
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768);
    }

    // Generate WhatsApp URL
    function getWhatsAppUrl(phoneNumber, message) {
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    }

    // Create and show QR code modal for desktop
    function showQRModal(phoneNumber, message) {
        // Remove existing modal if any
        const existingModal = document.getElementById('whatsapp-qr-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const waUrl = getWhatsAppUrl(phoneNumber, message);

        // Create modal HTML
        const modal = document.createElement('div');
        modal.id = 'whatsapp-qr-modal';
        modal.innerHTML = `
            <div class="wa-modal-overlay">
                <div class="wa-modal-content">
                    <button class="wa-modal-close" aria-label="Close">&times;</button>
                    <div class="wa-modal-header">
                        <svg class="wa-icon" viewBox="0 0 24 24" fill="#25D366">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <h2>Connect on WhatsApp</h2>
                    </div>
                    <p class="wa-modal-instruction">Scan this QR code with your phone to start a conversation with ForbiddenYoga</p>
                    <div class="wa-qr-container">
                        <div id="wa-qr-code"></div>
                    </div>
                    <p class="wa-modal-alt">Or open WhatsApp Web and click below:</p>
                    <a href="${waUrl}" target="_blank" class="wa-modal-button">Open WhatsApp Web</a>
                </div>
            </div>
        `;

        // Add styles
        const styles = document.createElement('style');
        styles.id = 'whatsapp-qr-styles';
        styles.textContent = `
            .wa-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                animation: waFadeIn 0.3s ease;
            }
            @keyframes waFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .wa-modal-content {
                background: #f3f2de;
                border-radius: 16px;
                padding: 40px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                position: relative;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                animation: waSlideUp 0.3s ease;
            }
            @keyframes waSlideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .wa-modal-close {
                position: absolute;
                top: 15px;
                right: 20px;
                background: none;
                border: none;
                font-size: 28px;
                cursor: pointer;
                color: #6B4423;
                transition: color 0.2s;
            }
            .wa-modal-close:hover {
                color: #31302C;
            }
            .wa-modal-header {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                margin-bottom: 20px;
            }
            .wa-icon {
                width: 32px;
                height: 32px;
            }
            .wa-modal-header h2 {
                font-family: 'Playfair Display', serif;
                color: #6B4423;
                margin: 0;
                font-size: 24px;
            }
            .wa-modal-instruction {
                color: #31302C;
                margin-bottom: 25px;
                line-height: 1.5;
            }
            .wa-qr-container {
                background: white;
                padding: 20px;
                border-radius: 12px;
                display: inline-block;
                margin-bottom: 20px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            #wa-qr-code {
                display: flex;
                justify-content: center;
                align-items: center;
            }
            #wa-qr-code canvas, #wa-qr-code img {
                display: block;
            }
            .wa-modal-alt {
                color: #666;
                font-size: 14px;
                margin-bottom: 15px;
            }
            .wa-modal-button {
                display: inline-block;
                background: #25D366;
                color: white;
                padding: 12px 30px;
                border-radius: 25px;
                text-decoration: none;
                font-weight: 500;
                transition: background 0.2s, transform 0.2s;
            }
            .wa-modal-button:hover {
                background: #128C7E;
                transform: scale(1.05);
            }
        `;

        document.head.appendChild(styles);
        document.body.appendChild(modal);

        // Generate QR code using a simple library or API
        generateQRCode(waUrl);

        // Close modal on overlay click
        modal.querySelector('.wa-modal-overlay').addEventListener('click', function(e) {
            if (e.target === this) {
                closeQRModal();
            }
        });

        // Close modal on button click
        modal.querySelector('.wa-modal-close').addEventListener('click', closeQRModal);

        // Close on escape key
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeQRModal();
                document.removeEventListener('keydown', escHandler);
            }
        });
    }

    function closeQRModal() {
        const modal = document.getElementById('whatsapp-qr-modal');
        if (modal) {
            modal.querySelector('.wa-modal-overlay').style.animation = 'waFadeIn 0.2s ease reverse';
            setTimeout(() => modal.remove(), 200);
        }
    }

    // Generate QR code using QR Server API (no library needed)
    function generateQRCode(url) {
        const qrContainer = document.getElementById('wa-qr-code');
        if (!qrContainer) return;

        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${WHATSAPP_CONFIG.qrSize}x${WHATSAPP_CONFIG.qrSize}&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=31302C`;

        const img = document.createElement('img');
        img.src = qrApiUrl;
        img.alt = 'WhatsApp QR Code';
        img.width = WHATSAPP_CONFIG.qrSize;
        img.height = WHATSAPP_CONFIG.qrSize;
        img.style.display = 'block';

        qrContainer.innerHTML = '';
        qrContainer.appendChild(img);
    }

    // Main function to handle WhatsApp contact
    function openWhatsApp(phoneNumber, message) {
        const phone = phoneNumber || WHATSAPP_CONFIG.phoneNumber;
        const msg = message || WHATSAPP_CONFIG.message;

        if (!phone) {
            console.error('WhatsApp phone number not configured');
            return;
        }

        if (isMobile()) {
            // On mobile, open WhatsApp directly
            window.location.href = getWhatsAppUrl(phone, msg);
        } else {
            // On desktop, show QR code modal
            showQRModal(phone, msg);
        }
    }

    // Expose to global scope
    window.ForbiddenYogaWhatsApp = {
        open: openWhatsApp,
        showQR: showQRModal,
        isMobile: isMobile,
        config: WHATSAPP_CONFIG
    };

    // Auto-attach to elements with data-whatsapp attribute
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('[data-whatsapp]').forEach(function(el) {
            el.addEventListener('click', function(e) {
                e.preventDefault();
                const phone = this.getAttribute('data-whatsapp-phone') || this.getAttribute('data-whatsapp');
                const message = this.getAttribute('data-whatsapp-message') || WHATSAPP_CONFIG.message;
                openWhatsApp(phone, message);
            });
        });
    });

})();
