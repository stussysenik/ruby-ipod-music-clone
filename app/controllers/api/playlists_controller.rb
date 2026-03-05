module Api
  class PlaylistsController < ApplicationController
    def index
      render json: Playlist.all.order(:name)
    end

    def show
      playlist = Playlist.includes(tracks: :album).find(params[:id])
      render json: {
        id: playlist.id,
        name: playlist.name,
        tracks: playlist.tracks.map do |t|
          { id: t.id, title: t.title, artist_name: t.artist_name,
            album_name: t.album.name, duration_seconds: t.duration_seconds,
            file_path: t.file_path, cover_image_path: t.album.cover_image_path }
        end
      }
    end
  end
end
