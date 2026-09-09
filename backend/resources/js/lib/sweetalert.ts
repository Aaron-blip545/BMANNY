import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

function escapeHtml(unsafe: string | null | undefined): string {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getIconBadgeHtml(iconType: 'success' | 'warning' | 'error' | 'info' | 'question' = 'warning'): string {
    switch (iconType) {
        case 'success':
            return `
                <div class="bmanny-modal-icon-badge bmanny-badge-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600 dark:text-emerald-400">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="m9 12 2 2 4-4"></path>
                    </svg>
                </div>
            `;
        case 'warning':
            return `
                <div class="bmanny-modal-icon-badge bmanny-badge-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-600 dark:text-amber-400">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </div>
            `;
        case 'error':
            return `
                <div class="bmanny-modal-icon-badge bmanny-badge-destructive">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="text-rose-600 dark:text-rose-400">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                </div>
            `;
        case 'question':
        case 'info':
        default:
            return `
                <div class="bmanny-modal-icon-badge bmanny-badge-info">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 dark:text-blue-400">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </div>
            `;
    }
}

// Base customized SweetAlert instance matching modern design
export const customSwal = Swal.mixin({
    background: 'var(--card)',
    color: 'var(--card-foreground)',
    customClass: {
        container: 'bmanny-swal-container',
        popup: 'bmanny-swal-popup',
        title: 'bmanny-swal-title',
        htmlContainer: 'bmanny-swal-html',
        actions: 'bmanny-swal-actions',
        confirmButton: 'bmanny-swal-confirm',
        cancelButton: 'bmanny-swal-cancel',
        denyButton: 'bmanny-swal-deny',
    },
    buttonsStyling: false,
    showClass: {
        popup: 'swal2-show animate-in fade-in-0 zoom-in-95 duration-200',
        backdrop: 'swal2-backdrop-show animate-in fade-in-0 duration-200',
    },
    hideClass: {
        popup: 'swal2-hide animate-out fade-out-0 zoom-out-95 duration-150',
        backdrop: 'swal2-backdrop-hide animate-out fade-out-0 duration-150',
    },
});

export interface PromptReasonOptions {
    title?: string;
    text?: string;
    originalMessage?: string | null;
    originalSender?: string | null;
    originalImageUrl?: string | null;
    inputPlaceholder?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    inputValue?: string;
}

/**
 * Modern SweetAlert prompt for collecting a reason or explanation,
 * displaying the original message context inside a styled preview card.
 */
export async function promptReasonModal(options: PromptReasonOptions = {}): Promise<string | null> {
    const {
        title = 'Flag Inappropriate Message',
        text = 'Why is this message inappropriate? The sender will receive this reason.',
        originalMessage = null,
        originalSender = null,
        originalImageUrl = null,
        inputPlaceholder = 'Enter the reason for flagging this message…',
        confirmButtonText = 'Flag Message',
        cancelButtonText = 'Cancel',
        inputValue = '',
    } = options;

    const iconBadge = getIconBadgeHtml('warning');

    const originalQuoteHtml = (originalMessage || originalImageUrl) ? `
        <div class="bmanny-modal-quote-box">
            <div class="bmanny-modal-quote-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-muted-foreground">
                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
                </svg>
                <span>${escapeHtml(originalSender ? `${originalSender}'s Message` : 'Original Message')}</span>
            </div>
            ${originalImageUrl ? `
                <div class="bmanny-modal-quote-img-wrap">
                    <img src="${escapeHtml(originalImageUrl)}" alt="Attachment preview" class="bmanny-modal-quote-img" />
                </div>
            ` : ''}
            ${originalMessage ? `
                <div class="bmanny-modal-quote-text">"${escapeHtml(originalMessage)}"</div>
            ` : ''}
        </div>
    ` : '';

    const htmlContent = `
        <div class="bmanny-modal-wrapper">
            ${iconBadge}
            <h3 class="bmanny-modal-title">${escapeHtml(title)}</h3>
            <p class="bmanny-modal-desc">${escapeHtml(text)}</p>

            ${originalQuoteHtml}

            <div class="bmanny-modal-input-group">
                <label for="swal-reason-textarea" class="bmanny-modal-input-label">Reason for flagging <span class="text-rose-500">*</span></label>
                <textarea
                    id="swal-reason-textarea"
                    class="bmanny-modal-textarea"
                    rows="3"
                    maxlength="500"
                    placeholder="${escapeHtml(inputPlaceholder)}"
                >${escapeHtml(inputValue)}</textarea>
                <div id="swal-custom-validation-msg" class="bmanny-modal-validation-error hidden">
                    Please provide a reason before submitting.
                </div>
            </div>
        </div>
    `;

    const result = await customSwal.fire({
        html: htmlContent,
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        reverseButtons: true,
        focusCancel: false,
        didOpen: () => {
            const textarea = document.getElementById('swal-reason-textarea') as HTMLTextAreaElement | null;
            const validationMsg = document.getElementById('swal-custom-validation-msg');

            if (textarea) {
                textarea.focus();
                textarea.addEventListener('input', () => {
                    if (validationMsg && !validationMsg.classList.contains('hidden')) {
                        validationMsg.classList.add('hidden');
                        textarea.classList.remove('border-rose-500');
                    }
                });
            }
        },
        preConfirm: () => {
            const textarea = document.getElementById('swal-reason-textarea') as HTMLTextAreaElement | null;
            const validationMsg = document.getElementById('swal-custom-validation-msg');
            const val = textarea?.value?.trim() ?? '';

            if (!val) {
                if (validationMsg) {
                    validationMsg.classList.remove('hidden');
                }
                if (textarea) {
                    textarea.classList.add('border-rose-500');
                    textarea.focus();
                }
                return false;
            }

            return val;
        },
    });

    if (result.isConfirmed && typeof result.value === 'string') {
        return result.value.trim();
    }

    return null;
}

export interface ConfirmModalOptions {
    title: string;
    text?: string;
    icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
    confirmButtonText?: string;
    cancelButtonText?: string;
    isDestructive?: boolean;
}

/**
 * Modern SweetAlert confirmation dialog
 */
export async function confirmModal(options: ConfirmModalOptions): Promise<boolean> {
    const {
        title,
        text,
        icon = 'question',
        confirmButtonText = 'Confirm',
        cancelButtonText = 'Cancel',
        isDestructive = false,
    } = options;

    const iconBadge = getIconBadgeHtml(icon);

    const htmlContent = `
        <div class="bmanny-modal-wrapper">
            ${iconBadge}
            <h3 class="bmanny-modal-title">${escapeHtml(title)}</h3>
            ${text ? `<p class="bmanny-modal-desc">${escapeHtml(text)}</p>` : ''}
        </div>
    `;

    const result = await customSwal.fire({
        html: htmlContent,
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        reverseButtons: true,
        customClass: {
            container: 'bmanny-swal-container',
            popup: 'bmanny-swal-popup',
            htmlContainer: 'bmanny-swal-html',
            actions: 'bmanny-swal-actions',
            confirmButton: isDestructive ? 'bmanny-swal-confirm-destructive' : 'bmanny-swal-confirm',
            cancelButton: 'bmanny-swal-cancel',
        },
    });

    return result.isConfirmed;
}

export interface AlertModalOptions {
    title?: string;
    text: string;
    icon?: 'success' | 'error' | 'warning' | 'info';
    confirmButtonText?: string;
}

/**
 * Modern SweetAlert alert dialog
 */
export async function alertModal(options: AlertModalOptions): Promise<void> {
    const {
        title = 'Notice',
        text,
        icon = 'info',
        confirmButtonText = 'OK',
    } = options;

    const iconBadge = getIconBadgeHtml(icon);

    const htmlContent = `
        <div class="bmanny-modal-wrapper">
            ${iconBadge}
            <h3 class="bmanny-modal-title">${escapeHtml(title)}</h3>
            <p class="bmanny-modal-desc">${escapeHtml(text)}</p>
        </div>
    `;

    await customSwal.fire({
        html: htmlContent,
        confirmButtonText,
    });
}

export default customSwal;
