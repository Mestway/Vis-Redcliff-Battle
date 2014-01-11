  $(function() {
    $( "#chapter-selector" ).slider({
      range: true,
      min: 84,
      max: 100,
      values: [ 84, 100 ],
      slide: function( event, ui ) {
        $( "#amount" ).val( ui.values[ 0 ]/2 + " - " + ui.values[ 1 ]/2 );
         ST_left_chapter = ui.values[ 0 ] / 2;
         ST_right_chapter = ui.values[ 1 ] / 2;

         $(".story").remove();
         $(".story").remove();
         var filename;
         filename = "bigevent.json";
         if(ST_right_chapter - ST_left_chapter <= 3)
            filename = "eventgraph.json";
         ST_initGraph(filename);
          GEO_searchByChapter(ST_left_chapter,ST_right_chapter);
         REL_chapter_filter(ST_left_chapter, ST_right_chapter);
      }
    });
    $( "#amount" ).val( "$" + $( "#slider-range" ).slider( "values", 0 ) +
      " - $" + $( "#slider-range" ).slider( "values", 1 ) );
  });