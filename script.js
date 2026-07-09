// ============================================
// Telegram Notification (через серверный прокси /tg-notify)
// ============================================

// Функция отправки в Telegram через серверный прокси
async function sendToTelegram(formData) {
    const payload = {
        name: formData.name,
        phone: formData.phone,
        service: formData.service,
        city: formData.city,
        counters: formData.counters,
        address: formData.address,
        comment: formData.message,
        type: formData.source === 'delivery_popup' ? 'Заявка (всплывающее окно)' : formData.type
    };

    Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
            delete payload[key];
        }
    });

    try {
        const response = await fetch('/tg-notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.ok) {
            console.log('✅ Заявка отправлена в Telegram');
            return true;
        }

        console.error('❌ Ошибка отправки в Telegram:', data);
        return false;
    } catch (error) {
        console.error('❌ Ошибка при отправке в Telegram:', error);
        return false;
    }
}

// ============================================
// Mobile Menu Toggle
// ============================================
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    
    // Animate hamburger menu
    const spans = mobileMenuBtn.querySelectorAll('span');
    if (mobileMenu.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(7px, 7px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
    } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
});

// Close mobile menu when clicking on a link
const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        const spans = mobileMenuBtn.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Phone number mask
const phoneInput = document.getElementById('phone');
phoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 0) {
        if (!value.startsWith('7') && !value.startsWith('8')) {
            value = '7' + value;
        }
        if (value.startsWith('8')) {
            value = '7' + value.substring(1);
        }
    }
    
    let formattedValue = '+7';
    if (value.length > 1) {
        formattedValue += ' (' + value.substring(1, 4);
    }
    if (value.length >= 5) {
        formattedValue += ') ' + value.substring(4, 7);
    }
    if (value.length >= 8) {
        formattedValue += '-' + value.substring(7, 9);
    }
    if (value.length >= 10) {
        formattedValue += '-' + value.substring(9, 11);
    }
    
    e.target.value = formattedValue;
});

// Price calculation removed - no total price field needed

// Form submission
const orderForm = document.getElementById('orderForm');
const successMessage = document.getElementById('successMessage');

orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = {
        service: document.getElementById('service').options[document.getElementById('service').selectedIndex].text,
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        city: document.getElementById('city').value,
        counters: document.getElementById('counters').value,
        address: document.getElementById('address').value,
        message: document.getElementById('message').value
    };
    
    // Log form data
    console.log('Заявка отправлена:', formData);
    
    // Отправка в Telegram через сервер
    const sent = await sendToTelegram(formData);
    
    if (!sent) {
        console.warn('Не удалось отправить заявку в Telegram, но форма обработана');
    }
    
    // Redirect to thanks page
    window.location.href = '/thanks';
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections
document.querySelectorAll('.service-card, .contact-card, .about-content, .stats-card, .accreditation-content, .review-card, .faq-item, .form-content, .complaint-wrapper').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// FAQ Accordion
const faqQuestions = document.querySelectorAll('.faq-question');

faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
        const faqItem = question.parentElement;
        const isActive = faqItem.classList.contains('active');
        
        // Close all other items
        document.querySelectorAll('.faq-item').forEach(item => {
            if (item !== faqItem) {
                item.classList.remove('active');
            }
        });
        
        // Toggle current item
        if (isActive) {
            faqItem.classList.remove('active');
        } else {
            faqItem.classList.add('active');
        }
    });
});

// Modal for certificate image
const certificateImg = document.getElementById('certificateImg');
const modal = document.getElementById('certificateModal');
const modalImg = document.getElementById('modalImg');
const closeModal = document.querySelector('.modal-close');

if (certificateImg && modal) {
    certificateImg.addEventListener('click', () => {
        modal.classList.add('active');
        modalImg.src = certificateImg.src;
    });

    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });
}

// Complaint Form
const complaintForm = document.getElementById('complaintForm');
const complaintSuccessMessage = document.getElementById('complaintSuccessMessage');
const complaintPhoneInput = document.getElementById('complaint-phone');

if (complaintPhoneInput) {
    complaintPhoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (!value.startsWith('7') && !value.startsWith('8')) {
                value = '7' + value;
            }
            if (value.startsWith('8')) {
                value = '7' + value.substring(1);
            }
        }
        
        let formattedValue = '+7';
        if (value.length > 1) {
            formattedValue += ' (' + value.substring(1, 4);
        }
        if (value.length >= 5) {
            formattedValue += ') ' + value.substring(4, 7);
        }
        if (value.length >= 8) {
            formattedValue += '-' + value.substring(7, 9);
        }
        if (value.length >= 10) {
            formattedValue += '-' + value.substring(9, 11);
        }
        
        e.target.value = formattedValue;
    });
}

if (complaintForm) {
    complaintForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('complaint-name').value,
            phone: document.getElementById('complaint-phone').value,
            order: document.getElementById('complaint-order').value,
            text: document.getElementById('complaint-text').value
        };
        
        console.log('Жалоба отправлена:', formData);
        
        complaintForm.style.display = 'none';
        complaintSuccessMessage.classList.add('active');
        
        setTimeout(() => {
            complaintForm.reset();
            complaintForm.style.display = 'block';
            complaintSuccessMessage.classList.remove('active');
        }, 5000);
    });
}

// Validate form fields
const validateForm = () => {
    const service = document.getElementById('service').value;
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const city = document.getElementById('city').value;
    const counters = document.getElementById('counters').value;
    const address = document.getElementById('address').value.trim();
    
    if (!service) {
        alert('Пожалуйста, выберите услугу');
        return false;
    }
    
    if (!name || !phone || !city || !counters || !address) {
        return false;
    }
    
    // Check if phone has correct length
    if (phone.replace(/\D/g, '').length !== 11) {
        alert('Пожалуйста, введите корректный номер телефона');
        return false;
    }
    
    // Check if counters is positive
    if (parseInt(counters) < 1) {
        alert('Количество счетчиков должно быть не менее 1');
        return false;
    }
    
    return true;
};

orderForm.addEventListener('submit', (e) => {
    if (!validateForm()) {
        e.preventDefault();
        return;
    }
});

// Delivery Popup - Show after 10 seconds
const deliveryPopup = document.getElementById('deliveryPopup');
const deliveryPopupClose = document.getElementById('deliveryPopupClose');
const deliveryPopupForm = document.getElementById('deliveryPopupForm');
const deliveryPopupSuccess = document.getElementById('deliveryPopupSuccess');
const deliveryPhoneInput = document.getElementById('delivery-phone');
const mobileOrderBtn = document.getElementById('mobileOrderBtn');

// Function to open delivery popup
const openDeliveryPopup = () => {
    if (deliveryPopup) {
        deliveryPopup.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

// Mobile order button - open popup
if (mobileOrderBtn) {
    mobileOrderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openDeliveryPopup();
    });
}

// Check if popup was already shown in this session
const popupShown = sessionStorage.getItem('deliveryPopupShown');

if (!popupShown && deliveryPopup) {
    // Show popup after 10 seconds
    setTimeout(() => {
        deliveryPopup.classList.add('active');
        // Prevent body scroll when popup is open
        document.body.style.overflow = 'hidden';
    }, 10000); // 10 seconds
}

// Phone number mask for delivery popup
if (deliveryPhoneInput) {
    deliveryPhoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (!value.startsWith('7') && !value.startsWith('8')) {
                value = '7' + value;
            }
            if (value.startsWith('8')) {
                value = '7' + value.substring(1);
            }
        }
        
        let formattedValue = '+7';
        if (value.length > 1) {
            formattedValue += ' (' + value.substring(1, 4);
        }
        if (value.length >= 5) {
            formattedValue += ') ' + value.substring(4, 7);
        }
        if (value.length >= 8) {
            formattedValue += '-' + value.substring(7, 9);
        }
        if (value.length >= 10) {
            formattedValue += '-' + value.substring(9, 11);
        }
        
        e.target.value = formattedValue;
    });
}

// Close popup functionality
if (deliveryPopupClose && deliveryPopup) {
    const closePopup = () => {
        deliveryPopup.classList.remove('active');
        document.body.style.overflow = '';
        sessionStorage.setItem('deliveryPopupShown', 'true');
    };

    deliveryPopupClose.addEventListener('click', closePopup);

    // Close when clicking outside the popup
    deliveryPopup.addEventListener('click', (e) => {
        if (e.target === deliveryPopup) {
            closePopup();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && deliveryPopup.classList.contains('active')) {
            closePopup();
        }
    });
}

// Delivery popup form submission
if (deliveryPopupForm) {
    deliveryPopupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('delivery-name').value.trim();
        const phone = document.getElementById('delivery-phone').value.trim();
        const address = document.getElementById('delivery-address').value.trim();
        
        // Validate form
        if (!name || !phone || !address) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        // Check if phone has correct length
        if (phone.replace(/\D/g, '').length !== 11) {
            alert('Пожалуйста, введите корректный номер телефона');
            return;
        }
        
        // Get form data
        const formData = {
            name: name,
            phone: phone,
            address: address,
            source: 'delivery_popup'
        };
        
        // Log form data
        console.log('Заявка из всплывающего окна:', formData);
        
        // Отправка в Telegram через сервер
        const sent = await sendToTelegram(formData);
        
        if (!sent) {
            console.warn('Не удалось отправить заявку в Telegram, но форма обработана');
        }
        
        // Redirect to thanks page
        window.location.href = '/thanks';
    });
}

