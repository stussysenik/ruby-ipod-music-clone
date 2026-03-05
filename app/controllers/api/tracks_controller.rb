module Api
  class TracksController < ApplicationController
    def index
      tracks = Track.includes(:album).order(:title)
      render json: tracks.map { |t| track_json(t) }
    end

    def show
      track = Track.includes(:album).find(params[:id])
      render json: track_json(track)
    end

    private

    def track_json(track)
      {
        id: track.id,
        title: track.title,
        artist_name: track.artist_name,
        album_name: track.album.name,
        album_id: track.album_id,
        duration_seconds: track.duration_seconds,
        file_path: track.file_path,
        cover_image_path: track.album.cover_image_path,
        track_number: track.track_number
      }
    end
  end
end
