(function (root) {
    var HashBattle = root.HashBattle = (root.HashBattle || {});
    
    var Visualizer = HashBattle.Visualizer = function() {
        this.socket = io();
        
        this.barCtx = $("#barchart").get(0).getContext("2d");
        this.lineCtx = $("#linechart").get(0).getContext("2d");

        this.hashtags = [];
        this.hashtagIndices = {};

        this.timeIndex = 0;
        this.prevTime;

        this.barChart;
        this.lineChart;

        this.newArray;

        this.colorPresets = ["rgba(151,205,169",
                             "rgba(205,121,127",
                             "rgba(151,187,205", 
                             "rgba(205,151,187", 
                             "rgba(205,169,151", 
                             "rgba(205,196,151", 
                             "rgba(196,151,205"];
        
        this.attachButtonClick();
        this.updateCharts();
        
    }
    
    //Setup visuals after hashtags are submitted
    Visualizer.prototype.attachButtonClick = function() {
        var that = this;
        $('#button').click(function(){
            that.hashtags = $('#m').val().split(' ');
    
            //generates array of zeros 
            that.newArray = Array.apply(null, 
                            new Array(that.hashtags.length)).map(Number.prototype.valueOf,
                            0);
    
            that.setupHashtagCounters();
            that.setupBarGraph();
            that.setupLineGraph();
            
            $('#line-container').append(that.lineChart.generateLegend());
            
            that.socket.emit('submit hashtags', $('#m').val());
            $('#m').val('');
        });
    }
    
    //Handle actions for new tweet
    Visualizer.prototype.updateCharts = function() {
        var that = this;
        that.socket.on('tweet', function(data) {
            if (moment.duration(moment().diff(that.prevTime)).seconds() >= 20) {
                that.timeIndex += 1;
                var newData = that.newArray.slice();
        
                that.prevTime = moment();
                that.lineChart.addData(newData, that.prevTime.format('hh:mm:ss'));
            }
    
            var count = that.barChart.datasets[0].bars[that.hashtagIndices[data['hashtag']]].value += 1;
            that.barChart.update();

            that.lineChart.datasets[that.hashtagIndices[data['hashtag']]].points[that.timeIndex].value += 1;
            that.lineChart.update();
    
             $('#counter-' + data['hashtag'].toLowerCase()).text("" + count);
        });
    }
    
    //Initialize hashtag counters
    Visualizer.prototype.setupHashtagCounters = function() {
        var $hashtagCounts = $('#hashtag-counts');

        for (var i = 0; i < this.hashtags.length; i++) {
            var lowerCased = this.hashtags[i].toLowerCase();
            this.hashtagIndices[lowerCased] = i;
            
            var $counterLi = $('<li></li>');
            $counterLi.text(this.hashtags[i] + ": ");
            $counterLi.append('<div id="counter-' + lowerCased + '">0</div>');
            
            $hashtagCounts.append($counterLi);
        }
    }
    
    //Initialize Bar Graph
    Visualizer.prototype.setupBarGraph = function() {
        var barData = {
            labels: this.hashtags,
            datasets: [
                {
                    label: "Hashtags",
                    fillColor: "rgba(151,187,205,0.2)",
                    strokeColor: "rgba(151,187,205,1)",
                    highlightFill: "#fff",
                    highlightStroke: "rgba(151,187,205,1)",
                    data: this.newArray.slice()
                }
            ]
        };

        this.barChart = new Chart(this.barCtx).Bar(barData);
    }
    
    //Initialize Line Graph
    Visualizer.prototype.setupLineGraph = function() {
        var that = this;
        var hashData = [];
        var i = 0;
        this.hashtags.forEach(function(hashtag) {
            var dataset = {};
            dataset.label = hashtag;
            dataset.data = [0];
        
            dataset.fillColor = that.colorPresets[i] + ",0.15)";
            dataset.strokeColor = that.colorPresets[i] + ",0.8)";
            dataset.highlightFill = that.colorPresets[i] + ",0.75)";
            dataset.highlightStroke = that.colorPresets[i] + ",1)";
        
            hashData.push(dataset);
            i++;
        });
    
        this.prevTime = moment();
    
        var lineData = {
            labels: [moment().format('hh:mm:ss')],
            datasets: hashData
        };
    
        var options = {
            legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\">" + 
                                "<% for (var i=0; i<datasets.length; i++){%>" + 
                                    "<li style=\"background-color:<%=datasets[i].strokeColor%>;\">" + 
                                        "<span>" + 
                                        "<%if(datasets[i].label){%>" + 
                                            "#<%=datasets[i].label%>" + 
                                        "<%}%></span>" + 
                                    "</li>" + 
                                "<%}%>" + 
                              "</ul>"
            }

        this.lineChart = new Chart(this.lineCtx).Line(lineData, options);
    }
    
})(this);

//Chart.js hack to make line graph work properly when adding data points.
Chart.Scale = Chart.Scale.extend({
    calculateX: function (index) {
        var isRotated = (this.xLabelRotation > 0),
            // innerWidth = (this.offsetGridLines) ? this.width - offsetLeft - this.padding : this.width - (offsetLeft + halfLabelWidth * 2) - this.padding,
            innerWidth = this.width - (this.xScalePaddingLeft + this.xScalePaddingRight),
            //check to ensure data is in chart otherwise we will get inifinity
            offsetGridLines = this.offsetGridLines ? 0 : 1,
            valueWidth = this.valuesCount - offsetGridLines === 0 ? 0 : innerWidth / (this.valuesCount - offsetGridLines),
            valueOffset = (valueWidth * index) + this.xScalePaddingLeft;

        if (this.offsetGridLines) {
            valueOffset += (valueWidth / 2);
        }

        return Math.round(valueOffset);
    },
});