/* Pulai PC application logic for index.html */
(() => {
  'use strict';

  let supabaseClient = null;
  const selectedGames = new Map();
  let usableStorageLimit = 0;
  let modalTrigger = null;
  const $ = (id) => document.getElementById(id);
  const appConfig = () => window.APP_CONFIG || {};
  const catalog = () => (typeof games !== 'undefined' && Array.isArray(games)) ? games : [];

  function showConfigError(message) {
    const banner = $('configErrorBanner');
    if (banner) banner.style.display = 'flex';
    if ($('configErrorText')) $('configErrorText').textContent = message;
  }

  function validPhone(showError = true) {
    const input = $('phoneInput');
    const valid = Boolean(input && /^\d{4}$/.test(input.value.trim()));
    input?.classList.toggle('required-missing', !valid);
    if ($('phoneError')) $('phoneError').textContent = valid || !showError ? '' : 'Enter exactly 4 digits.';
    return valid;
  }

  function save(id, key) {
    const element = $(id);
    if (element) localStorage.setItem(key, element.value);
  }

  function restoreSettings() {
    const values = {
      phoneInput: 'userPhone4', serviceTypeSelect: 'userServiceType',
      sdSourceSelect: 'userSdSource', userFreeStorageInput: 'userFreeStorage',
      consoleModelSelect: 'userConsoleModel'
    };
    Object.entries(values).forEach(([id, key]) => {
      const value = localStorage.getItem(key);
      if (value && $(id)) $(id).value = value;
    });
  }

  function populateSdCards() {
    const select = $('sdCardSelect');
    if (!select) return;
    const source = $('sdSourceSelect')?.value || 'own';
    const previous = localStorage.getItem('userSdSelect') || select.value;
    let options;
    if (source === 'own') {
      options = [['64', '64 GB Card'], ['128', '128 GB Card'], ['256', '256 GB Card'], ['512', '512 GB Card'], ['1024', '1 TB Card'], ['2048', '2 TB Card']];
    } else {
      options = Object.entries(appConfig().sdCardRetailPrices || {})
        .filter(([, price]) => Number(price) > 0)
        .map(([size, price]) => [size, `${Number(size) >= 1000 ? `${Number(size) / 1024} TB` : `${size} GB`} Card (RM${price})`]);
    }
    select.replaceChildren();
    (options.length ? options : [['256', '256 GB Card']]).forEach(([value, label]) => {
      const option = new Option(label, value);
      option.selected = String(value) === String(previous) || (!previous && value === '256');
      select.add(option);
    });
    localStorage.setItem('userSdSelect', select.value);
  }

  function toggleServiceFields() {
    const visible = $('serviceTypeSelect')?.value === 'jailbreak';
    ['consoleModelGroup', 'sdSourceGroup', 'sdCardGroup', 'freeStorageContainer', 'jailbreakModesContainer'].forEach((id) => {
      if ($(id)) $(id).style.display = visible ? 'flex' : 'none';
    });
    updateStorage();
  }

  function updateStorage() {
    const service = $('serviceTypeSelect')?.value;
    const card = Number($('sdCardSelect')?.value || 0);
    const free = Number($('userFreeStorageInput')?.value || 0);
    const addons = ($('androidModeCheck')?.checked ? 50 : 0) + ($('linuxModeCheck')?.checked ? 50 : 0);
    usableStorageLimit = service === 'jailbreak' ? Math.max(0, Math.min(free, card - 50) - addons) : Infinity;
    if ($('maxUsableLabel')) $('maxUsableLabel').textContent = Number.isFinite(usableStorageLimit) ? usableStorageLimit.toFixed(1) : 'Unlimited';
    const ready = validPhone(false) && (service !== 'jailbreak' || free > 0);
    if ($('storageWarningBanner')) $('storageWarningBanner').style.display = ready ? 'none' : 'flex';
    $('gameSectionWrapper')?.classList.toggle('locked', !ready);
    updateCheckout();
  }

  function renderGames() {
    const list = $('gameList');
    if (!list) return;
    const query = ($('searchInput')?.value || '').trim().toLowerCase();
    const matches = catalog().filter((game) => String(game.name).toLowerCase().includes(query));
    list.replaceChildren();
    if ($('clearSearchBtn')) $('clearSearchBtn').style.display = query ? 'block' : 'none';
    if ($('statusMsg')) $('statusMsg').textContent = matches.length ? '' : 'No games found.';

    matches.forEach((game) => {
      const card = document.createElement('div');
      const selected = selectedGames.has(game.name);
      card.className = `game-card${selected ? ' selected' : ''}`;
      card.tabIndex = 0;
      card.setAttribute('role', 'option');
      card.setAttribute('aria-selected', String(selected));
      const info = document.createElement('div'); info.className = 'game-info';
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = selected; checkbox.tabIndex = -1;
      checkbox.setAttribute('aria-label', `Select ${game.name}`);
      const title = document.createElement('span'); title.className = 'game-title'; title.textContent = game.name;
      const size = document.createElement('span'); size.className = 'game-size'; size.textContent = `${game.size} GB`;
      info.append(checkbox, title, size); card.append(info);
      const toggle = () => { selectedGames.has(game.name) ? selectedGames.delete(game.name) : selectedGames.set(game.name, game); renderGames(); updateCheckout(); };
      card.addEventListener('click', toggle);
      card.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); } });
      list.append(card);
    });
  }

  function revealGames() {
    if (!validPhone() || ($('serviceTypeSelect')?.value === 'jailbreak' && !Number($('userFreeStorageInput')?.value))) return;
    if ($('jailbreakNoticeCard')) $('jailbreakNoticeCard').style.display = 'none';
    if ($('gameSectionWrapper')) $('gameSectionWrapper').style.display = 'block';
    renderGames();
  }

  function selectedSize() { return [...selectedGames.values()].reduce((sum, game) => sum + Number(game.size || 0), 0); }

  function calculatePrice() {
    const service = $('serviceTypeSelect')?.value;
    const count = selectedGames.size;
    const size = selectedSize();
    let total = service === 'jailbreak' ? Number(appConfig().jailbreakPrices?.[$('consoleModelSelect')?.value] || 0) : service === 'system_setup' ? Number(appConfig().systemSetupPrice || 50) : 0;
    if (service === 'games_only') total = count <= 10 ? 30 : count <= 20 ? 50 : 80;
    if (service === 'jailbreak' && count > 3) total += count <= 13 ? 30 : count <= 23 ? 50 : 80;
    if (service === 'jailbreak' && size > 100) total += size <= 200 ? 20 : size <= 400 ? 50 : 80;
    if ($('androidModeCheck')?.checked) total += Number(appConfig().addonPrices?.android || 30);
    if ($('linuxModeCheck')?.checked) total += Number(appConfig().addonPrices?.linux || 30);
    return total;
  }

  function updateCheckout() {
    const size = selectedSize();
    if ($('selectedCount')) $('selectedCount').textContent = selectedGames.size;
    if ($('selectedSize')) $('selectedSize').textContent = size.toFixed(2);
    if ($('remainderSize')) $('remainderSize').textContent = Number.isFinite(usableStorageLimit) ? Math.max(0, usableStorageLimit - size).toFixed(2) : '—';
    if ($('selectedPrice')) $('selectedPrice').textContent = `RM${calculatePrice()}`;
  }

  function renderCart() {
    const body = $('cartModalBody');
    if (!body) return;
    body.replaceChildren();
    const heading = document.createElement('div'); heading.className = 'modal-section-title'; heading.textContent = 'Selected Games'; body.append(heading);
    if (!selectedGames.size) { const empty = document.createElement('p'); empty.textContent = 'No games selected.'; body.append(empty); }
    selectedGames.forEach((game, name) => {
      const row = document.createElement('div'); row.className = 'cart-item';
      const details = document.createElement('div'); details.className = 'cart-item-details';
      const title = document.createElement('div'); title.className = 'cart-item-title'; title.textContent = name;
      const sub = document.createElement('div'); sub.className = 'cart-item-sub'; sub.textContent = `${game.size} GB`;
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-btn'; remove.textContent = 'Remove';
      remove.addEventListener('click', () => { selectedGames.delete(name); renderCart(); renderGames(); updateCheckout(); });
      details.append(title, sub); row.append(details, remove); body.append(row);
    });
    if ($('modalTotal')) $('modalTotal').textContent = `${selectedGames.size} games total — RM${calculatePrice()}`;
  }

  function openCart() {
    if (!validPhone()) return;
    modalTrigger = document.activeElement;
    renderCart();
    $('cartModal')?.classList.add('active');
    if ($('modalBackdrop')) $('modalBackdrop').style.display = 'block';
    document.body.style.overflow = 'hidden';
    $('closeCartModal')?.focus();
  }

  function closeCart() {
    $('cartModal')?.classList.remove('active');
    if ($('modalBackdrop')) $('modalBackdrop').style.display = 'none';
    document.body.style.overflow = '';
    modalTrigger?.focus?.();
  }

  async function submitOrder() {
    if (!validPhone() || !selectedGames.size) { if (!selectedGames.size) alert('Please select at least one game.'); return; }
    if (!supabaseClient) { alert('The order service is unavailable. Please try again later.'); return; }
    const button = $('submitOrderBtn'); if (button) { button.disabled = true; button.textContent = 'Saving...'; }
    const order = {
      phone_id: $('phoneInput').value.trim(), service_type: $('serviceTypeSelect').value,
      console_model: $('consoleModelSelect').value, games: [...selectedGames.keys()], total_size: selectedSize(),
      total_price: calculatePrice(), android_mode: Boolean($('androidModeCheck')?.checked),
      linux_mode: Boolean($('linuxModeCheck')?.checked), remarks: $('orderRemarks')?.value.trim() || ''
    };
    try {
      const { error } = await supabaseClient.from('orders').insert([order]);
      if (error) throw error;
      alert(`Order submitted successfully. Total: RM${order.total_price}`);
      selectedGames.clear(); closeCart(); renderGames(); updateCheckout();
    } catch (error) { console.error('Order submission failed:', error); alert('Unable to submit the order. Please try again.'); }
    finally { if (button) { button.disabled = false; button.textContent = 'Save Changes'; } }
  }

  async function loadOrder() {
    if (!validPhone() || !supabaseClient) return;
    const button = $('loadOrderBtn'); if (button) { button.disabled = true; button.textContent = 'Loading...'; }
    try {
      const { data, error } = await supabaseClient.from('orders').select('*').eq('phone_id', $('phoneInput').value.trim()).order('created_at', { ascending: false }).limit(1);
      if (error) throw error;
      const order = data?.[0];
      if (!order) { alert('No previous order found.'); return; }
      selectedGames.clear();
      (Array.isArray(order.games) ? order.games : []).forEach((name) => { const game = catalog().find((item) => item.name === name); if (game) selectedGames.set(name, game); });
      if ($('androidModeCheck')) $('androidModeCheck').checked = Boolean(order.android_mode);
      if ($('linuxModeCheck')) $('linuxModeCheck').checked = Boolean(order.linux_mode);
      revealGames(); updateCheckout(); alert('Previous order loaded successfully.');
    } catch (error) { console.error('Load order failed:', error); alert('Unable to load the saved order.'); }
    finally { if (button) { button.disabled = false; button.textContent = '📂 Load Saved Order'; } }
  }

  function bindEvents() {
    $('phoneInput')?.addEventListener('input', () => { $('phoneInput').value = $('phoneInput').value.replace(/\D/g, '').slice(0, 4); localStorage.setItem('userPhone4', $('phoneInput').value); updateStorage(); });
    $('phoneInput')?.addEventListener('blur', () => validPhone());
    $('serviceTypeSelect')?.addEventListener('change', () => { save('serviceTypeSelect', 'userServiceType'); toggleServiceFields(); });
    $('sdSourceSelect')?.addEventListener('change', () => { save('sdSourceSelect', 'userSdSource'); populateSdCards(); updateStorage(); });
    ['sdCardSelect', 'consoleModelSelect', 'androidModeCheck', 'linuxModeCheck'].forEach((id) => $(id)?.addEventListener('change', updateStorage));
    $('userFreeStorageInput')?.addEventListener('input', () => { localStorage.setItem('userFreeStorage', $('userFreeStorageInput').value); updateStorage(); });
    $('browseGamesBtn')?.addEventListener('click', revealGames); $('searchInput')?.addEventListener('input', renderGames);
    $('clearSearchBtn')?.addEventListener('click', () => { $('searchInput').value = ''; renderGames(); });
    $('mainSubmitBtn')?.addEventListener('click', openCart); $('checkoutInfo')?.addEventListener('click', openCart);
    $('closeCartModal')?.addEventListener('click', closeCart); $('modalBackdrop')?.addEventListener('click', closeCart); $('submitOrderBtn')?.addEventListener('click', submitOrder); $('loadOrderBtn')?.addEventListener('click', loadOrder);
    $('clearGamesBtn')?.addEventListener('click', () => { if (confirm('Are you sure you want to clear all selected games and addons?')) { selectedGames.clear(); renderGames(); updateCheckout(); } });
    $('storageGuideToggle')?.addEventListener('click', () => { const box = $('storageGuideBox'); const open = box.style.display === 'block'; box.style.display = open ? 'none' : 'block'; box.setAttribute('aria-hidden', String(open)); $('storageGuideToggle').setAttribute('aria-expanded', String(!open)); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && $('cartModal')?.classList.contains('active')) closeCart(); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    restoreSettings();
    if (typeof window.supabase === 'undefined' || typeof window.APP_CONFIG === 'undefined') { showConfigError('Required configuration failed to load.'); return; }
    try { supabaseClient = window.supabase.createClient(appConfig().supabaseUrl, appConfig().supabaseAnonKey); } catch (error) { showConfigError('Supabase could not be initialized.'); console.error(error); }
    bindEvents(); populateSdCards(); toggleServiceFields(); renderGames(); updateCheckout();
  });
})();
