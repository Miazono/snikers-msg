converse.plugins.add('snikers-ui', {
    initialize() {
        const { api } = this._converse;

        api.listen.on('controlboxInitialized', () => {
            // Заменяем логотип
            const brandLogo = document.querySelector('converse-brand-logo');
            if (brandLogo && !document.getElementById('snikers-brand')) {
                brandLogo.innerHTML = `
                    <div id="snikers-brand" style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        padding: 28px 0 16px;
                        gap: 10px;">
                        <img src="/images/logo.svg"
                             width="60" height="60"
                             style="object-fit:contain;"
                             onerror="this.style.display='none'">
                        <span style="
                            font-size: 1.15rem;
                            font-weight: 600;
                            color: var(--foreground-color, #e8eaf0);
                            letter-spacing: -0.02em;">
                            Snikers MSG
                        </span>
                    </div>`;
            }

            // Убираем about-блок
            document.querySelector('converse-about')?.remove();
        });

        // Автозаполнение формы логина
        api.listen.on('loginInitialized', () => {
            document.querySelector('input[name="jid"]')
                ?.setAttribute('autocomplete', 'username');
            document.querySelector('input[type="password"]')
                ?.setAttribute('autocomplete', 'current-password');
            document.querySelector('form')
                ?.setAttribute('autocomplete', 'on');
        });
    }
});
