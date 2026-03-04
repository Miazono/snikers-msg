converse.plugins.add('snikers-ui', {
    initialize() {
        const { api } = this._converse;
        const _converse = this._converse;
        const { state, session } = this._converse;

        const applyBranding = () => {
            const brandLogo = document.querySelector('converse-brand-logo');
            if (!brandLogo) return;


            brandLogo.innerHTML = `
                <div id="snikers-brand" style="
                    display:flex; align-items:center;
                    justify-content:center; height:180px;">
                    <img src="/custom/images/logo.png"
                         style="max-width:900px; max-height:500px;
                                width:auto; height:auto;"
                         onerror="this.style.display='none'">
                </div>`;

            document.querySelector('converse-about')?.remove();
        };

        api.listen.on('initialized', () => {
            const tryReplace = (attempts = 0) => {
                if (document.querySelector('converse-brand-logo')) {
                    applyBranding();
                } else if (attempts < 20) {
                    setTimeout(() => tryReplace(attempts + 1), 100);
                }
            };
            tryReplace();

            document.addEventListener('click', () => {
                setTimeout(applyBranding, 150);
            }, true); // true = capture phase, раньше всех других обработчиков
        });

        // Автозаполнение
        api.listen.on('initialized', () => {
            const tryAutofill = (attempts = 0) => {
                const jidInput = document.querySelector('input[name="jid"]');
                if (jidInput) {
                    jidInput.setAttribute('autocomplete', 'username');
                    document.querySelector('input[type="password"]')
                        ?.setAttribute('autocomplete', 'current-password');
                    document.querySelector('form')
                        ?.setAttribute('autocomplete', 'on');
                } else if (attempts < 20) {
                    setTimeout(() => tryAutofill(attempts + 1), 100);
                }
            };
            tryAutofill();
        });

api.listen.on('getHeadingButtons', (el, buttons) => {
            if (el.tagName.toLowerCase() !== 'converse-chat') return buttons;

            buttons.push({
                a_class: 'start-video-call',
                handler: (ev) => {
                    ev.preventDefault();
                    const jid = el.getAttribute('jid');
                    const myJid = _converse.session.get('jid');
                    const roomId = Math.random().toString(36).slice(2, 10);

                    const chatbox = _converse.state.chatboxes.get(jid);
                    const receiverUrl = `https://${location.host}/call.html?room=${roomId}&name=${encodeURIComponent(jid)}`;
                    chatbox.sendMessage({ body: `📹 Входящий видеозвонок. Открой ссылку: ${receiverUrl}` });

                    window.open(
                        `/call.html?room=${roomId}&name=${encodeURIComponent(myJid)}&initiator=1`,
                        '_blank', 'width=900,height=600'
                    );
                },
                i18n_title: 'Видеозвонок',
                i18n_text: 'Звонок',
                icon_class: 'fa-video',
                name: 'video-call',
                standalone: false,
            });

            return buttons;
        });
    }
});
