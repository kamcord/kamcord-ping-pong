var show_inactive = false;
var sort_by_doubles = true;

$(document).ready(function()
{
    var seasonId = getQueryParams(document.location.search).s;
    var pingPongRef = firebase.database().ref("ping-pong/" + (seasonId ? "seasons/" + seasonId + "/" : ""));
    pingPongRef.on("value", handleRankings);

    $("#season").hide();
    $("#end_season").hide();
    addSeasonQueryParams(seasonId);
    initClickHandlers();
    setShowHideInactive();
});

function getQueryParams(qs) {
    qs = qs.split("+").join(" ");

    var params = {}, tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])]
            = decodeURIComponent(tokens[2]);
    }

    return params;
}

function addSeasonQueryParams(seasonId) {
    if (seasonId) {
        $("a").each(function(index) {
            href=$(this).attr("href");
            $(this).attr("href", href + "?s=" + seasonId);
        })
    }
}

function handleRankings(snapshot)
{
    var data = snapshot.val();
    Elo.setPingPong(data);
    sortPingPong();
    genRankingsHtml(PingPong);

    if (data['seasonName']) {
        $("#season").show();
        $("#season").text(data['seasonName'])
        $("$#end_season").hide();
    } else {
        $("#season").hide();
        $("#end_season").show();
    }
}

function sortPingPong() {
    if (sort_by_doubles) {
        PingPong.sort(function(a,b){return b['doubles-rank']-a['doubles-rank']});
    } else {
        PingPong.sort(function(a,b){return b['rank']-a['rank']});
    }
}

function genRankingsHtml(players)
{
    $("#rankings").empty();
    for( var p=0; p<players.length; p++ )
    {
        if( !players[p]['inactive'] || show_inactive )
        {
            $("#rankings").append(genRankHtml(players[p]));
        }
    }

    $("#doubles_rank_header").css("text-decoration", sort_by_doubles ? "underline" : "none");
    $("#singles_rank_header").css("text-decoration", sort_by_doubles ? "none" : "underline");
}

function genRankHtml(player)
{
    var seasonId = getQueryParams(document.location.search).s;
    var htmlString = "<li>";
    htmlString += "<a class='player' href='player.html?n=" + player['name'] + (seasonId?"&s="+seasonId:"") + "'>";
    htmlString += "<span class='player_name'>" + player['name'] + "</span>";
    htmlString += "<span class='player_rank'>" + parseInt(player['rank']) + "</span>";
    htmlString += "<span class='player_rank'>" + parseInt(player['doubles-rank']) + "</span>";
    if( player['inactive'] )
    {
        htmlString += "<div class='player_inactive'>INACTIVE</div>";
    }
    htmlString += "</a>";
    htmlString += "</li>";
    return htmlString;
}

function initClickHandlers()
{
    $("#hidden").on("click", function()
    {
        show_inactive = !show_inactive;
        genRankingsHtml(PingPong);
        setShowHideInactive();
    });

    $("#singles_rank_header").on("click", function()
    {
        if (sort_by_doubles) {
            sort_by_doubles = false;
            sortPingPong();
            genRankingsHtml(PingPong);
        }
    });

    $("#doubles_rank_header").on("click", function()
    {
        if (!sort_by_doubles) {
            sort_by_doubles = true;
            sortPingPong();
            genRankingsHtml(PingPong);
        }
    });

    $("#end_season").on("click", function() {
        $("body").scrollTop(0);
        $("#end_season_auth_background").fadeIn(200);
    });
    $("#end_season_close_auth,#cancel").on("click", function()
    {
        firebase.auth().signOut();
        $("#end_season_auth_background").fadeOut(200);
    });
    $("#close_sign_in").on("click", function()
    {
        $("#sign_in_background").fadeOut(200);
    });
    $("#submit").on("click", function()
    {
        submitNewSeason($("#season_name_input").val());
    });
}

function setShowHideInactive()
{
    if( show_inactive )
    {
        $("#hidden").text("Hide Inactive");
    }
    else
    {
        $("#hidden").text("Show Inactive");
    }
}

function submitNewSeason(seasonName)
{
    if (firebase.auth().currentUser) {
        var pingPongRef = firebase.database().ref("ping-pong");
        pingPongRef.once('value', function(snapshot) {
            var data = snapshot.val();
            data['seasonName'] = seasonName;
            data['seasons'] = null;
            var seasonRef = pingPongRef.child("seasons").push(data);
            seasonRef.update({'timestamp': firebase.database.ServerValue.TIMESTAMP});
            pingPongRef.update({'matches': null, 'doubles-matches': null, 'players': null});
        });
        $("#end_season_auth_background").fadeOut(200);
    } else {
        $("#sign_in_background").fadeIn(200);
        $("#username_input").focus();
        $("#sign_in_button").on("click", function() {
            var email = $("#username_input").val();
            var password = $("#password_input").val();
            firebase.auth().signInWithEmailAndPassword(email, password).then(function(user) {
                $("#sign_in_background").fadeOut(200);
            }, function(error) {
                shake($("#sign_in"), 7, 7, 25, 50);
            });
        });
    }
}

function shake(element, iterations, count, offset, delay) {
    var left = parseInt(element.css("left"));
    var dLeft = 0;
    if (count == iterations) {
        dLeft = -offset / 2;
    } else if (count == 0) {
        dLeft = offset / 2;
    } else {
        dLeft = count % 2 == 0 ? offset : -offset;
    }
    element.css({"left": left + dLeft});
    if (count > 0) {
        setTimeout(function() {
            shake(element, iterations, count - 1, offset, delay);
        }, delay);
    }
}
