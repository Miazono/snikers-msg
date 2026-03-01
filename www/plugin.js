converse.plugins.add('snikers-ui', {
    initialize() {
        const { api } = this._converse;

        api.listen.on('controlboxInitialized', () => {

            // ── Логотип ──────────────────────────────────────────
            const brandLogo = document.querySelector('converse-brand-logo');
            if (brandLogo && !document.getElementById('snikers-brand')) {
                brandLogo.innerHTML = `
                    <div id="snikers-brand" style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        padding: 28px 0 16px;
                        gap: 10px;
                    ">
                        <img src="/images/logo.svg"
                             width="60" height="60"
                             style="object-fit:contain;"
                             onerror="this.style.display='none'">
                        <span style="
                            font-size: 1.15rem;
                            font-weight: 600;
                            color: var(--foreground-color, #e8eaf0);
                            letter-spacing: -0.02em;
                        ">Snikers MSG</span>
                    </div>
                `;
            }

            // ── Убрать about-блок ──────────────────────────────
            document.querySelector('converse-about')?.remove();
        });

        // ── Автозаполнение (заменяет твой MutationObserver) ────
        api.listen.on('loginInitialized', () => {
            const jidInput  = document.querySelector('input[name="jid"]');
            const passInput = document.querySelector('input[type="password"]');
            const form      = document.querySelector('form');
            jidInput?.setAttribute('autocomplete', 'username');
            passInput?.setAttribute('autocomplete', 'current-password');
            form?.setAttribute('autocomplete', 'on');
        });
    }
});
