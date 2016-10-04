$(function() {
    var datepickerconfig = {
        prevText: '&#x3c;zurück',
        prevStatus: '',
        prevJumpText: '&#x3c;&#x3c;',
        prevJumpStatus: '',
        nextText: 'Vor&#x3e;',
        nextStatus: '',
        nextJumpText: '&#x3e;&#x3e;',
        nextJumpStatus: '',
        currentText: 'heute',
        currentStatus: '',
        todayText: 'heute',
        todayStatus: '',
        clearText: '-',
        clearStatus: '',
        closeText: 'schließen',
        closeStatus: '',
        monthNames: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
            'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
        ],
        monthNamesShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
            'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
        ],
        dayNames: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
        dayNamesShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
        dayNamesMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
        showMonthAfterYear: false,
        showOn: 'both',
        buttonImageOnly: true,
        dateFormat: 'd MM, y',
        firstDay:1
    }
    $("#startdatepicker").datepicker(datepickerconfig);
    $("#enddatepicker").datepicker(datepickerconfig);

});
