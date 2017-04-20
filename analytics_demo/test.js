      

      function drawTable() {

        var data = new google.visualization.DataTable();
        data.addColumn('string', 'Name');
        data.addColumn('number', 'Number of Songs');
        data.addColumn('boolean', 'Friends?');
        data.addRows([
          ['Will',  400, false],
          ['Roshni', 350 ,  false],
          ['John', 500, true],
          ['Rob',600   , true],
          ['Ryan', 200 , true]
        ]);

        var table = new google.visualization.Table(document.getElementById('table_div'));

        table.draw(data, {showRowNumber: true, width: '100%', height: '100%'});
      }

    

    function drawMap() {
      var data = google.visualization.arrayToDataTable([
        ['Country', 'Name'],
        ['Japan', 'John'],
        ['India', 'Roshni'],
        ['US', 'Will']

      ]);

    var options = {
      showTooltip: true,
      showInfoWindow: true
    };

    var map = new google.visualization.Map(document.getElementById('chart_div'));

    map.draw(data, options);
  };


  function drawChart() {

        var data = google.visualization.arrayToDataTable([
          ['Label', 'Value'],
          ['Will', 80],
          ['Roshni', 55],
          ['Plotka', 68]
        ]);

        var options = {
          // title: 'My Daily Activities',
          width: 400, height: 120,
          redFrom: 90, redTo: 100,
          yellowFrom:75, yellowTo: 90,
          minorTicks: 5
        };

        var chart = new google.visualization.Gauge(document.getElementById('gauge_div'));

        chart.draw(data, options);

        // setInterval(function() {
        //   data.setValue(0, 1, 40 + Math.round(60 * Math.random()));
        //   chart.draw(data, options);
        // }, 13000);
        // setInterval(function() {
        //   data.setValue(1, 1, 40 + Math.round(60 * Math.random()));
        //   chart.draw(data, options);
        // }, 5000);
        // setInterval(function() {
        //   data.setValue(2, 1, 60 + Math.round(20 * Math.random()));
        //   chart.draw(data, options);
        // }, 26000);
      }

  function drawPie() {
        var data = google.visualization.arrayToDataTable([
          ['Song', 'Number of Plays'],
          ['Sugar',     11],
          ['Dream On',      2],
          ['Let Me Love You',  2],
          ['Hotel California', 2],
          ['Clocks',    7]
        ]);

        var options = {
          title: 'Top Played Songs',
          pieHole: 0.4,
        };

        var chart = new google.visualization.PieChart(document.getElementById('donutchart'));
        chart.draw(data, options);
      }

  function draw3DPie() {
        var data = google.visualization.arrayToDataTable([
          ['Song', 'Number of Plays'],
          ['Sugar',     11],
          ['Dream On',      2],
          ['Let Me Love You',  2],
          ['Hotel California', 2],
          ['Clocks',    7]
        ]);

        var options = {
          title: 'Top Played Songs',
          is3D: true,
        };

        var chart = new google.visualization.PieChart(document.getElementById('piechart_3d'));
        chart.draw(data, options);
      }
