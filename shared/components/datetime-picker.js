// shared/components/datetime-picker.js
// Flatpickr(CDN, 무의존성)를 이 프로젝트 기본값(한국어, 날짜+시간, 과거 날짜 비활성)으로
// 감싼 얇은 래퍼. flatpickr 본체/한국어 로케일 스크립트가 먼저 로드되어 있어야 한다.
function initDateTimePicker(selector, opts){
  if(typeof flatpickr === 'undefined') return null;
  return flatpickr(selector, Object.assign({
    enableTime: true,
    time_24hr: true,
    dateFormat: 'Y-m-d H:i',
    minDate: 'today',
    locale: (flatpickr.l10ns && flatpickr.l10ns.ko) ? 'ko' : undefined,
  }, opts || {}));
}
