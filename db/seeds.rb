albums_data = [
  { name: "Neon Dreams", artist_name: "Synthwave Collective", cover_image_path: "/images/albums/album_1.svg", year: 2024,
    tracks: [
      { title: "Digital Sunrise", duration_seconds: 245, track_number: 1 },
      { title: "Chrome Highway", duration_seconds: 198, track_number: 2 },
      { title: "Neon Reflections", duration_seconds: 312, track_number: 3 }
    ] },
  { name: "Ocean Waves", artist_name: "Coastal Sound", cover_image_path: "/images/albums/album_2.svg", year: 2023,
    tracks: [
      { title: "Tidal Pull", duration_seconds: 267, track_number: 1 },
      { title: "Deep Current", duration_seconds: 184, track_number: 2 },
      { title: "Shore Break", duration_seconds: 229, track_number: 3 }
    ] },
  { name: "Golden Hour", artist_name: "Amber Fields", cover_image_path: "/images/albums/album_3.svg", year: 2024,
    tracks: [
      { title: "Warm Light", duration_seconds: 203, track_number: 1 },
      { title: "Harvest Moon", duration_seconds: 276, track_number: 2 }
    ] },
  { name: "Midnight Jazz", artist_name: "The Night Quartet", cover_image_path: "/images/albums/album_4.svg", year: 2022,
    tracks: [
      { title: "Smoky Room", duration_seconds: 341, track_number: 1 },
      { title: "Blue Note Walk", duration_seconds: 289, track_number: 2 },
      { title: "Last Call", duration_seconds: 256, track_number: 3 }
    ] },
  { name: "Electric Pulse", artist_name: "Circuit Breaker", cover_image_path: "/images/albums/album_5.svg", year: 2025,
    tracks: [
      { title: "Voltage", duration_seconds: 178, track_number: 1 },
      { title: "Frequency Shift", duration_seconds: 234, track_number: 2 }
    ] }
]

track_file_index = 1

albums_data.each do |album_data|
  tracks = album_data.delete(:tracks)
  album = Album.create!(album_data)

  tracks.each do |track_data|
    file_num = track_file_index.to_s.rjust(2, "0")
    album.tracks.create!(
      title: track_data[:title],
      artist_name: album_data[:artist_name],
      duration_seconds: track_data[:duration_seconds],
      file_path: "/audio/track_#{file_num}.mp3",
      track_number: track_data[:track_number]
    )
    track_file_index += 1
  end
end

# Create a demo playlist
playlist = Playlist.create!(name: "Favorites")
[ "Digital Sunrise", "Tidal Pull", "Warm Light", "Smoky Room", "Voltage" ].each_with_index do |title, i|
  track = Track.find_by(title: title)
  PlaylistTrack.create!(playlist: playlist, track: track, position: i + 1) if track
end

puts "Seeded #{Album.count} albums, #{Track.count} tracks, #{Playlist.count} playlists"
